import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';
import { SubjectPlanFilters } from '../../domain/entity/subject-plan-filters';
import { SubjectPlanRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface';
import { SubjectPlanNotFoundException, SubjectPlanAlreadyExistsException, ForeignKeyConstraintViolationException } from '../../domain/exceptions/itba.exceptions';
import { GenericDomainException, ResourceNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { PrismaService } from '@career/infrastructure/database/prisma.service';

export class SubjectPlanRepository implements SubjectPlanRepositoryInterface {
    private readonly prisma: PrismaService;

    constructor(prisma: PrismaService) {
        this.prisma = prisma;
    }

    async find(filters: SubjectPlanFilters): Promise<SubjectPlan[]> {
        const where = this.buildWhereClause(filters);
        const orderBy = this.buildOrderByClause(filters);

        const planSubjects = await this.prisma.planSubject.findMany({ where, orderBy });

        if (planSubjects.length === 0) {
            return [];
        }

        return this.enrichWithSubjects(planSubjects);
    }

    private buildWhereClause(filters: SubjectPlanFilters): any {
        const { planId, subjectId, section, year, semester, electivesOnly } = filters;

        const baseFilters = {
            ...(planId && { planId }),
            ...(subjectId && { subjectId }),
            ...(section && { section }),
        };

        const electiveFilters = electivesOnly ? { year: 0, semester: 0 } : {};
        const yearSemesterFilters = {
            ...(year !== undefined && { year }),
            ...(semester !== undefined && { semester }),
        };

        return { ...baseFilters, ...electiveFilters, ...yearSemesterFilters };
    }

    private buildOrderByClause(filters: SubjectPlanFilters): any[] {
        const hasYearOnly = filters.year !== undefined && filters.semester === undefined;
        const hasAnyFilter = Object.values(filters).some(value => value !== undefined);

        return hasYearOnly
            ? [{ semester: 'asc' }, { subjectId: 'asc' }]
            : hasAnyFilter
            ? [{ subjectId: 'asc' }]
            : [{ planId: 'asc' }, { subjectId: 'asc' }];
    }

    private async enrichWithSubjects(planSubjects: any[]): Promise<SubjectPlan[]> {
        const subjectIds = [...new Set(planSubjects.map(ps => ps.subjectId))];

        const subjects = await this.prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true, credits: true }
        });

        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        return planSubjects.map(ps => this.mapToSubjectPlan(ps, subjectMap.get(ps.subjectId)!));
    }

    async findAll(): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters());
    }

    async findByPlanId(planId: string): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(planId));
    }

    async findBySubjectId(subjectId: string): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(undefined, subjectId));
    }

    async findByPlanAndSubject(planId: string, subjectId: string): Promise<SubjectPlan | null> {
        const results = await this.find(new SubjectPlanFilters(planId, subjectId));
        return results.length > 0 ? results[0] : null;
    }

    async create(subjectPlan: SubjectPlan): Promise<SubjectPlan> {
        // First check if plan exists
        const planExists = await this.prisma.plan.findUnique({
            where: { id: subjectPlan.planId }
        });
        
        if (!planExists) {
            throw new ResourceNotFoundException(
                "Plan",
                subjectPlan.planId
            );
        }

        const planSubjectResult = await this.prisma.planSubject.create({
            data: {
                subjectId: subjectPlan.subjectId,
                planId: subjectPlan.planId,
                section: subjectPlan.section,
                year: subjectPlan.year ?? 0,
                semester: subjectPlan.semester ?? 0,
                dependencies: subjectPlan.dependencies,
                creditsRequired: subjectPlan.creditsRequired ?? 0
            }
        }).catch(err => {
            switch (err.code) {
                case 'P2002':
                    throw new SubjectPlanAlreadyExistsException(
                        `Subject plan for plan ${subjectPlan.planId} and subject ${subjectPlan.subjectId} already exists`, 
                        err
                    );
                case 'P2003':
                    throw new ForeignKeyConstraintViolationException(
                        `Invalid foreign key reference in subject plan`, 
                        err
                    );
                default:
                    throw new GenericDomainException(`Failed to create subject plan`, err);
            }
        });

        // Fetch the subject
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectPlan.subjectId },
            select: { id: true, name: true, credits: true }
        });

        if (!subject) {
            throw new Error(`Subject with ID ${subjectPlan.subjectId} not found`);
        }

        return this.mapToSubjectPlan(planSubjectResult, subject);
    }

    async update(subjectPlan: SubjectPlan): Promise<SubjectPlan> {
        const planSubjectResult = await this.prisma.planSubject.update({
            where: {
                subjectId_planId: {
                    subjectId: subjectPlan.subjectId,
                    planId: subjectPlan.planId
                }
            },
            data: {
                section: subjectPlan.section,
                year: subjectPlan.year ?? 0,
                semester: subjectPlan.semester ?? 0,
                dependencies: subjectPlan.dependencies,
                creditsRequired: subjectPlan.creditsRequired ?? 0
            }
        }).catch(err => {
            switch (err.code) {
                case 'P2025':
                    throw new SubjectPlanNotFoundException(
                        subjectPlan.planId,
                        subjectPlan.subjectId,
                        err
                    );
                case 'P2002':
                    throw new SubjectPlanAlreadyExistsException(
                        `Subject plan for plan ${subjectPlan.planId} and subject ${subjectPlan.subjectId} already exists`, 
                        err
                    );
                case 'P2003':
                    throw new ForeignKeyConstraintViolationException(
                        `Invalid foreign key reference in subject plan`, 
                        err
                    );
                default:
                    throw new GenericDomainException('Failed to update subject plan', err);
            }
        });

        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectPlan.subjectId },
            select: { id: true, name: true, credits: true }
        });

        if (!subject) {
            throw new Error(`Subject with ID ${subjectPlan.subjectId} not found`);
        }

        return this.mapToSubjectPlan(planSubjectResult, subject);
    }

    async delete(planId: string, subjectId: string): Promise<void> {
        await this.prisma.planSubject.delete({
            where: {
                subjectId_planId: {
                    subjectId,
                    planId
                }
            }
        }).catch(err => {
            switch (err.code) {
                case 'P2025':
                    throw new SubjectPlanNotFoundException(
                        planId,
                        subjectId,
                        err
                    );
                case 'P2003':
                    throw new ForeignKeyConstraintViolationException(
                        `Cannot delete subject plan: it has related records`, 
                        err
                    );
                default:
                    throw new GenericDomainException('Failed to delete subject plan', err);
            }
        });
    }

    async findBySection(planId: string, section: string): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(planId, undefined, section));
    }

    async findElectives(planId: string): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(planId, undefined, undefined, undefined, undefined, true));
    }

    async findByYear(planId: string, year: number): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(planId, undefined, undefined, year));
    }

    async findBySemester(planId: string, year: number, semester: number): Promise<SubjectPlan[]> {
        return this.find(new SubjectPlanFilters(planId, undefined, undefined, year, semester));
    }

    private mapToSubjectPlan(planSubjectData: any, subjectData: any | null): SubjectPlan {
        if (!subjectData) {
            throw new Error(`Subject not found for plan-subject mapping: ${planSubjectData.subjectId}`);
        }

        const subject = new Subject(
            subjectData.id,
            subjectData.name,
            subjectData.credits
        );

        return new SubjectPlan(
            planSubjectData.subjectId,
            planSubjectData.planId,
            planSubjectData.section,
            planSubjectData.year,
            planSubjectData.semester,
            planSubjectData.dependencies || [],
            planSubjectData.creditsRequired,
            subject
        );
    }
}


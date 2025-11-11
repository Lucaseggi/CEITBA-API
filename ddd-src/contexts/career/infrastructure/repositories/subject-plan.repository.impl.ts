import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';
import { SubjectPlanRepositoryInterface, SubjectPlanFilters } from '../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface';
import { SubjectPlanNotFoundException, SubjectPlanAlreadyExistsException, ForeignKeyConstraintViolationException } from '../../domain/exceptions/itba.exceptions';
import { GenericDomainException, ResourceNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { PrismaService } from '@boot/database/prisma.service';

export class SubjectPlanRepository implements SubjectPlanRepositoryInterface {
    private readonly prisma: PrismaService;

    constructor(prisma: PrismaService) {
        this.prisma = prisma;
    }

    async find(filters: SubjectPlanFilters): Promise<SubjectPlan[]> {
        // Build where clause dynamically based on provided filters
        const where: any = {};

        if (filters.planId) {
            where.planId = filters.planId;
        }

        if (filters.subjectId) {
            where.subjectId = filters.subjectId;
        }

        if (filters.section) {
            where.section = filters.section;
        }

        if (filters.year !== undefined) {
            where.year = filters.year;
        }

        if (filters.semester !== undefined) {
            where.semester = filters.semester;
        }

        // Handle electivesOnly flag
        if (filters.electivesOnly) {
            where.year = 0;
            where.semester = 0;
        }

        // Determine optimal orderBy based on filters
        let orderBy: any[] = [];
        if (filters.year !== undefined && filters.semester === undefined) {
            // Year only: order by semester then subject
            orderBy = [{ semester: 'asc' }, { subjectId: 'asc' }];
        } else if (filters.planId || filters.year !== undefined || filters.semester !== undefined || filters.section || filters.subjectId || filters.electivesOnly) {
            // Any specific filter: order by subject only
            orderBy = [{ subjectId: 'asc' }];
        } else {
            // No filters (findAll): order by plan and subject
            orderBy = [{ planId: 'asc' }, { subjectId: 'asc' }];
        }

        const planSubjects = await this.prisma.planSubject.findMany({
            where,
            orderBy
        });

        if (planSubjects.length === 0) {
            return [];
        }

        // Get all unique subject IDs
        const subjectIds = [...new Set(planSubjects.map(ps => ps.subjectId))];

        // Batch fetch subjects
        const subjects = await this.prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true, credits: true }
        });

        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        return planSubjects.map(ps => this.mapToSubjectPlan(ps, subjectMap.get(ps.subjectId)!));
    }

    async findAll(): Promise<SubjectPlan[]> {
        return this.find({});
    }

    async findByPlanId(planId: string): Promise<SubjectPlan[]> {
        return this.find({ planId });
    }

    async findBySubjectId(subjectId: string): Promise<SubjectPlan[]> {
        return this.find({ subjectId });
    }

    async findByPlanAndSubject(planId: string, subjectId: string): Promise<SubjectPlan | null> {
        const results = await this.find({ planId, subjectId });
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
        return this.find({ planId, section });
    }

    async findElectives(planId: string): Promise<SubjectPlan[]> {
        return this.find({ planId, electivesOnly: true });
    }

    async findByYear(planId: string, year: number): Promise<SubjectPlan[]> {
        return this.find({ planId, year });
    }

    async findBySemester(planId: string, year: number, semester: number): Promise<SubjectPlan[]> {
        return this.find({ planId, year, semester });
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


import { Inject,  Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ItbaMappers } from '../../infrastructure/mappers/itba.mappers';
import { SubjectResponseDto } from '../dtos/subject.dto';
import { SectionSubjectsDto, SubjectDetailDto, CommissionDto } from '../dtos/subject-plan-response.dto';
import { SubjectServiceInterface } from '../../domain/interfaces/application/subject.service.interface';
import { SUBJECT_SERVICE, SUBJECT_PLAN_SERVICE, COMMISSION_REPOSITORY } from '@boot/di/injection-tokens';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { CommissionRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';

@ApiTags('Subjects')
@Controller('v1/itba/subjects')
export class SubjectController {
    constructor(
        @Inject(SUBJECT_SERVICE) private readonly subjectService: SubjectServiceInterface,
        @Inject(SUBJECT_PLAN_SERVICE) private readonly subjectPlanService: SubjectPlanServiceInterface,
        @Inject(COMMISSION_REPOSITORY) private readonly commissionRepository: CommissionRepositoryInterface
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get subjects organized by plan' })
    @ApiQuery({ name: 'plan', description: 'Plan identifier (e.g. S10-Rev23)', required: true })
    @ApiResponse({ status: 200, description: 'Subjects organized by section, year, and semester', type: SectionSubjectsDto })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    async getSubjectsByPlan(@Query('plan') plan: string): Promise<SectionSubjectsDto> {
        if (!plan) {
            throw new NotFoundException('Plan parameter is required');
        }

        // Get subject plans from service (domain layer)
        const subjectPlans = await this.subjectPlanService.getSubjectsByPlanWithFilters(plan, {});

        if (subjectPlans.length === 0) {
            throw new NotFoundException('No subjects found for the specified plan');
        }

        // Get all commissions for mapping
        const allCommissions = await this.commissionRepository.findAll();

        // Organize subjects by section, year, semester (presentation logic)
        const organizedSubjects: SectionSubjectsDto = {};

        for (const subjectPlan of subjectPlans) {
            const section = subjectPlan.section;
            const year = subjectPlan.year?.toString() || '0';
            const semester = subjectPlan.semester?.toString() || '0';

            if (!organizedSubjects[section]) {
                organizedSubjects[section] = {};
            }
            if (!organizedSubjects[section][year]) {
                organizedSubjects[section][year] = {};
            }
            if (!organizedSubjects[section][year][semester]) {
                organizedSubjects[section][year][semester] = [];
            }

            const subjectCommissions = allCommissions.filter(
                commission => commission.subjectCode === subjectPlan.subjectId
            );

            const commissions: CommissionDto[] = subjectCommissions.map(commission => ({
                name: commission.commissionName,
                schedule: commission.times.map(time => ({
                    day: time.day.toString(),
                    classroom: time.classroom,
                    building: time.building,
                    time_from: time.hourFrom.toTimeString().slice(0, 8),
                    time_to: time.hourTo.toTimeString().slice(0, 8)
                }))
            }));

            const subjectDetail: SubjectDetailDto = {
                section: subjectPlan.section,
                subject_id: subjectPlan.subjectId,
                name: subjectPlan.subject.name,
                credits: subjectPlan.subject.credits,
                dependencies: subjectPlan.dependencies,
                credits_required: subjectPlan.creditsRequired,
                course_start: subjectCommissions.length > 0
                    ? subjectCommissions[0].courseStart.toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                course_end: subjectCommissions.length > 0
                    ? subjectCommissions[0].courseEnd.toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                commissions: commissions
            };

            organizedSubjects[section][year][semester].push(subjectDetail);
        }

        return organizedSubjects;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a subject by ID' })
    @ApiParam({ name: 'id', description: 'Subject identifier (e.g. plan code)' })
    @ApiResponse({ status: 200, description: 'Subject found', type: SubjectResponseDto })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async getSubjectById(@Param('id') id: string) {
        const subject = await this.subjectService.getSubjectById(id);

        if (!subject) {
            throw new NotFoundException('Subject not found');
        }

        return ItbaMappers.subjectToDto(subject);
    }
}

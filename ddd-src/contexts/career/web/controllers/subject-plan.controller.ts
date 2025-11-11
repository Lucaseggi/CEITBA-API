import { Inject,  Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ResourceNotFoundException, ValidationException } from '../../domain/exceptions/domain.exceptions';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { GetSubjectsByPlanQueryDto } from '../dtos/get-subjects-by-plan-query.dto';
import { CreateSubjectPlanDto, UpdateSubjectPlanDto } from '../dtos/subject-plan.dto';
import { SubjectPlanResponseDto } from '../dtos/subject-plan-response.dto';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { SUBJECT_PLAN_SERVICE } from '@boot/di/injection-tokens';
import { ForeignKeyConstraintViolationException } from '../../domain/exceptions/itba.exceptions';

@ApiTags('Subject Plans')
@Controller('v1/plans')
export class SubjectPlanController {
    constructor(@Inject(SUBJECT_PLAN_SERVICE) private readonly subjectPlanService: SubjectPlanServiceInterface) { }

    @Get(':planId/subjects')
    @ApiOperation({ summary: 'List all subject plans for a given plan with optional filters' })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiResponse({ status: 200, description: 'List of subject plans', type: [SubjectPlanResponseDto] })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    async list(
        @Param('planId') planId: string,
        @Query() query: GetSubjectsByPlanQueryDto
    ): Promise<SubjectPlanResponseDto[]> {
        try {
            const subjectPlans = await this.subjectPlanService.getSubjectsByPlanWithFilters(planId, {
                year: query.year || undefined,
                semester: query.semester || undefined,
                section: query.section,
                electivesOnly: query.electivesOnly
            });
            return SubjectPlanResponseDto.fromEntities(subjectPlans);
        } catch (error: unknown) {
            if (error instanceof ResourceNotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }

    @Get(':planId/subjects/:subjectId')
    @ApiOperation({ summary: 'Get a specific subject plan by plan and subject ID' })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiParam({ name: 'subjectId', description: 'Subject ID' })
    @ApiResponse({ status: 200, description: 'Subject plan found', type: SubjectPlanResponseDto })
    @ApiResponse({ status: 404, description: 'Subject plan not found' })
    async findOne(
        @Param('planId') planId: string,
        @Param('subjectId') subjectId: string
    ): Promise<SubjectPlanResponseDto> {
        const subjectPlan = await this.subjectPlanService.getSubjectPlan(planId, subjectId);

        if (!subjectPlan) {
            throw new NotFoundException('Subject plan not found');
        }

        return SubjectPlanResponseDto.fromEntity(subjectPlan);
    }

    @Post(':planId/subjects')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new subject plan' })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiBody({ type: CreateSubjectPlanDto })
    @ApiResponse({ status: 201, description: 'Subject plan created successfully', type: SubjectPlanResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid request or subject/plan not found' })
    async create(
        @Param('planId') planId: string,
        @Body() createData: CreateSubjectPlanDto
    ): Promise<SubjectPlanResponseDto> {
        try {
            const subjectPlan = await this.subjectPlanService.createSubjectPlan(
                createData.subjectId,
                planId,
                createData.section,
                createData.year ?? null,
                createData.semester ?? null,
                createData.dependencies ?? [],
                createData.creditsRequired ?? null
            );
            return SubjectPlanResponseDto.fromEntity(subjectPlan);
        } catch (error: unknown) {
            if (error instanceof ResourceNotFoundException ||
                error instanceof ValidationException ||
                error instanceof ForeignKeyConstraintViolationException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    @Put(':planId/subjects/:subjectId')
    @ApiOperation({ summary: 'Update an existing subject plan' })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiParam({ name: 'subjectId', description: 'Subject ID' })
    @ApiBody({ type: UpdateSubjectPlanDto })
    @ApiResponse({ status: 200, description: 'Subject plan updated successfully', type: SubjectPlanResponseDto })
    @ApiResponse({ status: 404, description: 'Subject plan not found' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async update(
        @Param('planId') planId: string,
        @Param('subjectId') subjectId: string,
        @Body() updateData: UpdateSubjectPlanDto
    ): Promise<SubjectPlanResponseDto> {
        try {
            const updatedSubjectPlan = await this.subjectPlanService.updateSubjectPlan(planId, subjectId, updateData);

            if (!updatedSubjectPlan) {
                throw new NotFoundException('Subject plan not found');
            }

            return SubjectPlanResponseDto.fromEntity(updatedSubjectPlan);
        } catch (error: unknown) {
            if (error instanceof ResourceNotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof ValidationException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    @Delete(':planId/subjects/:subjectId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a subject plan' })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiParam({ name: 'subjectId', description: 'Subject ID' })
    @ApiResponse({ status: 204, description: 'Subject plan deleted successfully' })
    @ApiResponse({ status: 404, description: 'Subject plan not found' })
    async remove(
        @Param('planId') planId: string,
        @Param('subjectId') subjectId: string
    ): Promise<void> {
        try {
            const deleted = await this.subjectPlanService.deleteSubjectPlan(planId, subjectId);

            if (!deleted) {
                throw new NotFoundException('Subject plan not found');
            }
        } catch (error: unknown) {
            if (error instanceof ResourceNotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
import { Injectable, Inject } from "@nestjs/common";
import { SubjectPlan } from "../../domain/entity/subject-plan.model";
import { SubjectPlanRepository } from "../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface";
import { SubjectRepository } from "../../domain/interfaces/infrastructure/repositories/subject.repository.interface";
import { ItbaApiService } from "../../domain/interfaces/infrastructure/gateway/itba-api.service.interface";
import { SubjectPlanServiceInterface } from "../../domain/interfaces/application/subject-plan.service.interface";
import { CommissionService } from "../../domain/interfaces/application/commission.service.interface";
import {
  ValidationException,
  ResourceNotFoundException,
} from "@/shared/exceptions/domain.exceptions";
import {
  SUBJECT_PLAN_REPOSITORY,
  SUBJECT_REPOSITORY,
  ITBA_API_SERVICE,
  COMMISSION_REPOSITORY,
} from "@/shared/constants/injection-tokens";
import { CommissionRepository } from "../../domain/interfaces/infrastructure/repositories/commission.repository.interface";
import { PrismaService } from "@/shared/database/prisma.service";
import { CreateSubjectPlanDto } from "../dtos/subjectPlan.dto";
import { CommissionDto, SectionSubjectsDto, SubjectDetailDto } from "../../web/dtos/subject-plan-response.dto";

@Injectable()
export class SubjectPlanService implements SubjectPlanServiceInterface {
  constructor(
    @Inject(SUBJECT_PLAN_REPOSITORY)
    private readonly subjectPlanRepository: SubjectPlanRepository,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepository: SubjectRepository,
    @Inject(ITBA_API_SERVICE) private readonly itbaApiService: ItbaApiService,
    @Inject(COMMISSION_REPOSITORY)
    private readonly commissionRepository: CommissionRepository,
  ) {}

  async getSubjectsByPlan(planId: string): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findByPlanId(planId);
  }

  async getSubjectsByPlanWithFilters(
    planId: string,
    filters: {
      year?: number;
      semester?: number;
      section?: string;
      type?: "elective";
    },
  ): Promise<SubjectPlan[]> {
    // Handle filtering by both year and semester if both are provided
    if (filters.year !== undefined && filters.semester !== undefined) {
      return await this.getSubjectsBySemester(
        planId,
        filters.year,
        filters.semester,
      );
    }

    // Handle filtering just by semester
    if (filters.semester !== undefined) {
      // Get all subjects for the plan
      const subjects = await this.getSubjectsByPlan(planId);
      // Filter them by semester
      return subjects.filter(subject => subject.semester === filters.semester);
    }

    // Handle filtering just by year
    if (filters.year !== undefined) {
      return await this.getSubjectsByYear(planId, filters.year);
    }

    if (filters.section) {
      return await this.getSubjectsBySection(planId, filters.section);
    }

    if (filters.type === "elective") {
      return await this.getElectiveSubjects(planId);
    }

    return await this.getSubjectsByPlan(planId);
  }

  async getSubjectsByPlanFromApi(planId: string): Promise<SubjectPlan[]> {
    return await this.itbaApiService.getSubjectsByPlan(planId);
  }

  async getSubjectPlansBySubject(subjectId: string): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findBySubjectId(subjectId);
  }

  async getSubjectPlan(
    planId: string,
    subjectId: string,
  ): Promise<SubjectPlan | null> {
    return await this.subjectPlanRepository.findByPlanAndSubject(
      planId,
      subjectId,
    );
  }

  async createSubjectPlan(
    createSubjectPlanDto: CreateSubjectPlanDto,
  ): Promise<SubjectPlan> {
    const subject = await this.subjectRepository.findById(
      createSubjectPlanDto.subjectId,
    );
    if (!subject) {
      throw new ResourceNotFoundException(
        "Subject",
        createSubjectPlanDto.subjectId,
      );
    }

    const existingSubjectPlan =
      await this.subjectPlanRepository.findByPlanAndSubject(
        createSubjectPlanDto.planId,
        createSubjectPlanDto.subjectId,
      );
    if (existingSubjectPlan) {
      throw new ValidationException(
        "subjectPlan",
        `${createSubjectPlanDto.planId}-${createSubjectPlanDto.subjectId}`,
        "Subject plan already exists for this plan and subject combination",
      );
    }

    const dependencies = createSubjectPlanDto.dependencies || [];

    const subjectPlan = new SubjectPlan(
      createSubjectPlanDto.subjectId,
      createSubjectPlanDto.planId,
      createSubjectPlanDto.section,
      createSubjectPlanDto.year ?? 0,
      createSubjectPlanDto.semester ?? 0,
      dependencies,
      createSubjectPlanDto.creditsRequired ?? 0,
      subject,
    );

    return await this.subjectPlanRepository.create(subjectPlan);
  }

  async updateSubjectPlan(
    planId: string,
    subjectId: string,
    updateData: Partial<CreateSubjectPlanDto>,
  ): Promise<SubjectPlan | null> {
    const existingSubjectPlan =
      await this.subjectPlanRepository.findByPlanAndSubject(planId, subjectId);
    if (!existingSubjectPlan) {
      return null;
    }

    const updatedSubjectPlan = new SubjectPlan(
      subjectId,
      planId,
      updateData.section ?? existingSubjectPlan.section,
      updateData.year ?? existingSubjectPlan.year,
      updateData.semester ?? existingSubjectPlan.semester,
      updateData.dependencies ?? existingSubjectPlan.dependencies,
      updateData.creditsRequired ?? existingSubjectPlan.creditsRequired,
      existingSubjectPlan.subject,
    );

    return await this.subjectPlanRepository.update(updatedSubjectPlan);
  }

  async deleteSubjectPlan(planId: string, subjectId: string): Promise<boolean> {
    const existingSubjectPlan =
      await this.subjectPlanRepository.findByPlanAndSubject(planId, subjectId);
    if (!existingSubjectPlan) {
      return false;
    }

    await this.subjectPlanRepository.delete(planId, subjectId);
    return true;
  }

  async getSubjectsBySection(
    planId: string,
    section: string,
  ): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findBySection(planId, section);
  }

  async getElectiveSubjects(planId: string): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findElectives(planId);
  }

  async getSubjectsByYear(
    planId: string,
    year: number,
  ): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findByYear(planId, year);
  }

  async getSubjectsBySemester(
    planId: string,
    year: number,
    semester: number,
  ): Promise<SubjectPlan[]> {
    return await this.subjectPlanRepository.findBySemester(
      planId,
      year,
      semester,
    );
  }

  async getSubjectDependencies(
    planId: string,
    subjectId: string,
  ): Promise<SubjectPlan[]> {
    const subjectPlan = await this.subjectPlanRepository.findByPlanAndSubject(
      planId,
      subjectId,
    );
    if (!subjectPlan || !subjectPlan.hasDependencies()) {
      return [];
    }

    const dependencies: SubjectPlan[] = [];
    for (const depId of subjectPlan.dependencies) {
      const depSubjectPlan =
        await this.subjectPlanRepository.findByPlanAndSubject(planId, depId);
      if (depSubjectPlan) {
        dependencies.push(depSubjectPlan);
      }
    }

    return dependencies;
  }

  async getSubjectsByPlanOrganized(planId: string): Promise<SectionSubjectsDto> {
    const subjectPlans = await this.getSubjectsByPlanFromApi(planId);
    
    if (!subjectPlans || subjectPlans.length === 0) {
      return {};
    }

    const allCommissions = await this.commissionRepository.findAll();
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
}

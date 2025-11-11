import { Injectable, Inject } from "@nestjs/common";
import { SubjectPlan } from "../../domain/entity/subject-plan.model";
import { SubjectPlanRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface";
import { SubjectRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/subject.repository.interface";
import { SubjectPlanServiceInterface } from "../../domain/interfaces/application/subject-plan.service.interface";
import {
  ValidationException,
  ResourceNotFoundException,
} from "../../domain/exceptions/domain.exceptions";
import {
  SUBJECT_PLAN_REPOSITORY,
  SUBJECT_REPOSITORY,
} from "@boot/di/injection-tokens";

@Injectable()
export class SubjectPlanService implements SubjectPlanServiceInterface {
  constructor(
    @Inject(SUBJECT_PLAN_REPOSITORY)
    private readonly subjectPlanRepository: SubjectPlanRepositoryInterface,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepository: SubjectRepositoryInterface,
  ) {}

  async getSubjectsByPlanWithFilters(
    planId: string,
    filters: {
      year?: number;
      semester?: number;
      section?: string;
      electivesOnly?: boolean;
    },
  ): Promise<SubjectPlan[]> {
    if (filters.year !== undefined && filters.semester !== undefined) {
      return await this.subjectPlanRepository.findBySemester(
        planId,
        filters.year,
        filters.semester,
      );
    }

    if (filters.semester !== undefined) {
      const subjects = await this.subjectPlanRepository.findByPlanId(planId);
      return subjects.filter(subject => subject.semester === filters.semester);
    }

    if (filters.year !== undefined) {
      return await this.subjectPlanRepository.findByYear(planId, filters.year);
    }

    if (filters.section) {
      return await this.subjectPlanRepository.findBySection(planId, filters.section);
    }

    if (filters.electivesOnly === true) {
      return await this.subjectPlanRepository.findElectives(planId);
    }

    return await this.subjectPlanRepository.findByPlanId(planId);
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
    subjectId: string,
    planId: string,
    section: string,
    year: number | null,
    semester: number | null,
    dependencies: string[],
    creditsRequired: number | null,
  ): Promise<SubjectPlan> {
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) {
      throw new ResourceNotFoundException("Subject", subjectId);
    }

    const existingSubjectPlan =
      await this.subjectPlanRepository.findByPlanAndSubject(planId, subjectId);
    if (existingSubjectPlan) {
      throw new ValidationException(
        "subjectPlan",
        `${planId}-${subjectId}`,
        "Subject plan already exists for this plan and subject combination",
      );
    }

    const subjectPlan = new SubjectPlan(
      subjectId,
      planId,
      section,
      year ?? 0,
      semester ?? 0,
      dependencies,
      creditsRequired ?? 0,
      subject,
    );

    return await this.subjectPlanRepository.create(subjectPlan);
  }

  async updateSubjectPlan(
    planId: string,
    subjectId: string,
    updateData: {
      section?: string;
      year?: number | null;
      semester?: number | null;
      dependencies?: string[];
      creditsRequired?: number | null;
    },
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
      updateData.year !== undefined ? updateData.year : existingSubjectPlan.year,
      updateData.semester !== undefined ? updateData.semester : existingSubjectPlan.semester,
      updateData.dependencies ?? existingSubjectPlan.dependencies,
      updateData.creditsRequired !== undefined ? updateData.creditsRequired : existingSubjectPlan.creditsRequired,
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
}

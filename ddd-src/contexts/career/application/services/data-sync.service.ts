import { Injectable, Logger, Inject } from "@nestjs/common";
import { Subject } from "../../domain/entity/subject.model";
import { SubjectPlan } from "../../domain/entity/subject-plan.model";
import { Commission } from "../../domain/entity/commission.model";
import {
  ItbaApiGatewayInterface,
  CommissionQueryParams,
} from "../../domain/interfaces/infrastructure/gateway/itba-api.gateway.interface";
import { SubjectRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/subject.repository.interface";
import { SubjectPlanRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface";
import { CommissionRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/commission.repository.interface";
import { CareerRepositoryInterface } from "../../domain/interfaces/infrastructure/repositories/career.repository.interface";
import {
  CAREER_REPOSITORY,
  SUBJECT_REPOSITORY,
  SUBJECT_PLAN_REPOSITORY,
  COMMISSION_REPOSITORY,
  ITBA_API_SERVICE,
} from "@boot/di/injection-tokens";

interface SyncStats {
  created: number;
  updated: number;
  errors: number;
}

export interface DataSyncResult {
  subjects: SyncStats;
  subjectPlans: SyncStats;
  commissions: SyncStats;
  totalProcessed: number;
  duration: number;
}

function createSyncStats(): SyncStats {
  return { created: 0, updated: 0, errors: 0 };
}

function addStats(source1: SyncStats, source2: SyncStats) {
  const stats = createSyncStats();
  stats.created = source2.created + source1.created;
  stats.updated = source2.updated + source1.updated;
  stats.errors = source2.errors + source1.errors;
  return stats;
}

export function createDataSyncResult(): DataSyncResult {
  return {
    subjects: createSyncStats(),
    subjectPlans: createSyncStats(),
    commissions: createSyncStats(),
    totalProcessed: 0,
    duration: 0,
  };
}

export interface DataSyncOptions {
  commissionParams?: CommissionQueryParams;
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    @Inject(ITBA_API_SERVICE)
    private readonly itbaApiService: ItbaApiGatewayInterface,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepository: SubjectRepositoryInterface,
    @Inject(SUBJECT_PLAN_REPOSITORY)
    private readonly subjectPlanRepository: SubjectPlanRepositoryInterface,
    @Inject(COMMISSION_REPOSITORY)
    private readonly commissionRepository: CommissionRepositoryInterface,
    @Inject(CAREER_REPOSITORY)
    private readonly careerRepository: CareerRepositoryInterface,
  ) { }

  async syncAllData(options?: DataSyncOptions): Promise<DataSyncResult> {
    const startTime = Date.now();
    this.logger.log("Starting data synchronization...");

    const result: DataSyncResult = {
      subjects: { created: 0, updated: 0, errors: 0 },
      subjectPlans: { created: 0, updated: 0, errors: 0 },
      commissions: { created: 0, updated: 0, errors: 0 },
      totalProcessed: 0,
      duration: 0,
    };

    try {
      await this.syncSubjectsAndPlans(result);

      await this.syncCommissions(result, options?.commissionParams);

      result.duration = Date.now() - startTime;
      result.totalProcessed =
        result.subjects.created +
        result.subjects.updated +
        result.subjectPlans.created +
        result.subjectPlans.updated +
        result.commissions.created +
        result.commissions.updated;

      this.logger.log(
        `Data synchronization completed in ${result.duration}ms. Processed ${result.totalProcessed} items.`,
      );

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      this.logger.error(
        `Data synchronization failed after ${result.duration}ms:`,
        error,
      );
      throw error;
    }
  }

  async syncSubjectsAndPlans(result: DataSyncResult): Promise<void> {
    this.logger.log("Synchronizing subjects and subject plans...");

    try {
      const careers = await this.careerRepository.findCareersWithPlans();

      for (const [careerId, career] of Object.entries(careers)) {
        for (const planId of career.plans) {
          try {
            const subjectPlans =
              await this.itbaApiService.getSubjectsByPlan(planId);

            result.subjects = await this.syncEntities(
              subjectPlans.map(sp => sp.subject),
              (subject) => this.upsertSubject(subject)
            );

            result.subjectPlans = await this.syncEntities(
              subjectPlans,
              (plan) => this.upsertSubjectPlan(plan)
            );
          } catch (error) {
            this.logger.error(
              `Failed to sync plan ${planId} for career ${careerId}:`,
              error,
            );
            result.subjectPlans.errors++;
          }
        }
      }

      this.logger.log(
        `Subject sync completed. Created: ${result.subjects.created + result.subjectPlans.created}, Updated: ${result.subjects.updated + result.subjectPlans.updated}`,
      );
    } catch (error) {
      this.logger.error("Failed to sync subjects and plans:", error);
      throw error;
    }
  }

  async syncCommissions(
    result: DataSyncResult,
    params?: CommissionQueryParams,
  ): Promise<void> {
    this.logger.log("Synchronizing commissions...");

    const actualParams = this.getEffectiveCommissionParams(params);
    this.logger.log(
      `Using commission sync parameters: year=${actualParams.year}, period=${actualParams.period}, levels=${actualParams.levels.join(",")}`,
    );

    try {
      const commissions = await this.itbaApiService.getCommissions(params);

      if (commissions.length === 0) {
        this.logger.warn("No commissions returned from ITBA API");
        return;
      }

      const existingSubjects = await this.subjectRepository.findAll();
      const existingSubjectIds = new Set(existingSubjects.map((s) => s.id));

      const missingSubjects = new Map<string, Subject>();

      for (const commission of commissions) {
        if (!existingSubjectIds.has(commission.subjectCode)) {
          if (!missingSubjects.has(commission.subjectCode)) {
            const missingSubject = new Subject(
              commission.subjectCode,
              commission.subjectCode, // TODO: Implement proper subject name retrieval
              0, // Placeholder credits
            );
            missingSubjects.set(commission.subjectCode, missingSubject);
          }
        }
      }

      if (missingSubjects.size > 0) {
        this.logger.log(
          `Creating ${missingSubjects.size} missing subjects found in commissions...`,
        );
        for (const [subjectCode, subject] of missingSubjects) {
          try {
            await this.subjectRepository.create(subject);
            result.subjects.created++;
            this.logger.debug(`Created missing subject: ${subjectCode}`);
            existingSubjectIds.add(subjectCode);
          } catch (error) {
            this.logger.error(
              `Failed to create missing subject ${subjectCode}:`,
              error,
            );
            result.subjects.errors++;
          }
        }
      }

      for (const commission of commissions) {
        if (existingSubjectIds.has(commission.subjectCode)) {
          await this.upsertCommission(commission, result);
        } else {
          this.logger.warn(
            `Still skipping commission ${commission.id} - subject ${commission.subjectCode} could not be created`,
          );
        }
      }

      this.logger.log(
        `Commission sync completed. Processed ${commissions.length} commissions. Created: ${result.commissions.created}, Updated: ${result.commissions.updated}`,
      );
    } catch (error) {
      this.logger.error("Failed to sync commissions:", error);
      throw error;
    }
  }

  private getEffectiveCommissionParams(
    params?: CommissionQueryParams,
  ): Required<CommissionQueryParams> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const defaultPeriod =
      currentMonth >= 2 && currentMonth <= 6
        ? "FirstSemester"
        : "SecondSemester";

    return {
      year: params?.year ?? currentYear,
      period: params?.period ?? defaultPeriod,
      levels: params?.levels ?? ["GRADUATE", "UNDERGRADUATE"],
    };
  }

  private async upsertSubject(subject: Subject): Promise<SyncStats> {
    const stats = createSyncStats();

    try {
      const existingSubject = await this.subjectRepository.findById(subject.id);
      if (existingSubject) {
        if (
          existingSubject.name !== subject.name ||
          existingSubject.credits !== subject.credits
        ) {
          await this.subjectRepository.update(subject);
          stats.updated++;
          this.logger.debug`Updated subject: ${subject.id}`;
        }
      } else {
        await this.subjectRepository.create(subject);
        stats.created++;
        this.logger.debug`Created subject: ${subject.id}`;
      }
    } catch (error) {
      this.logger.error(`Failed to upsert subject ${subject.id}:`, error);
      stats.errors++;
    }

    return stats;
  }

  private async upsertSubjectPlan(subjectPlan: SubjectPlan): Promise<SyncStats> {
    const stats = { created: 0, updated: 0, errors: 0 };

    try {
      const existingPlan =
        await this.subjectPlanRepository.findByPlanAndSubject(
          subjectPlan.planId,
          subjectPlan.subjectId,
        );
      if (existingPlan) {
        if (this.hasSubjectPlanChanged(existingPlan, subjectPlan)) {
          await this.subjectPlanRepository.update(subjectPlan);
          stats.updated++;
          this.logger.debug(
            `Updated subject plan: ${subjectPlan.planId}-${subjectPlan.subjectId}`,
          );
        }
      } else {
        await this.subjectPlanRepository.create(subjectPlan);
        stats.created++;
        this.logger.debug(
          `Created subject plan: ${subjectPlan.planId}-${subjectPlan.subjectId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to upsert subject plan ${subjectPlan.planId}-${subjectPlan.subjectId}:`,
        error,
      );
      stats.errors++;
    }

    return stats;
  }

  private async upsertCommission(
    commission: Commission,
    result: DataSyncResult,
  ): Promise<void> {
    try {
      const existingCommission = await this.commissionRepository.findById(
        commission.id,
      );

      if (existingCommission) {
        if (this.hasCommissionChanged(existingCommission, commission)) {
          await this.commissionRepository.upsert(commission);
          result.commissions.updated++;
          this.logger.debug(`Updated commission: ${commission.id}`);
        }
      } else {
        await this.commissionRepository.upsert(commission);
        result.commissions.created++;
        this.logger.debug(`Created commission: ${commission.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to upsert commission ${commission.id}:`, error);
      result.commissions.errors++;
    }
  }

  private hasSubjectPlanChanged(
    existing: SubjectPlan,
    updated: SubjectPlan,
  ): boolean {
    return (
      existing.section !== updated.section ||
      existing.year !== updated.year ||
      existing.semester !== updated.semester ||
      existing.creditsRequired !== updated.creditsRequired ||
      JSON.stringify(existing.dependencies.sort()) !==
      JSON.stringify(updated.dependencies.sort())
    );
  }

  private hasCommissionChanged(
    existing: Commission,
    updated: Commission,
  ): boolean {
    return (
      existing.subjectCode !== updated.subjectCode ||
      existing.commissionName !== updated.commissionName ||
      existing.courseStart.getTime() !== updated.courseStart.getTime() ||
      existing.courseEnd.getTime() !== updated.courseEnd.getTime() ||
      existing.enrolledStudents !== updated.enrolledStudents ||
      existing.quota !== updated.quota ||
      existing.subjectType !== updated.subjectType ||
      JSON.stringify(existing.times) !== JSON.stringify(updated.times)
    );
  }

  async syncSubjectsByPlan(planId: string): Promise<SubjectPlan[]> {
    this.logger.log(`Synchronizing subjects for plan: ${planId}`);

    try {
      const subjectPlans = await this.itbaApiService.getSubjectsByPlan(planId);
      const result = createDataSyncResult();

      for (const subjectPlan of subjectPlans) {
        const subjectStats = await this.upsertSubject(subjectPlan.subject);
        result.subjects = addStats(subjectStats, result.subjects);

        const subjectPlanStats = await this.upsertSubjectPlan(subjectPlan);
        result.subjectPlans = addStats(subjectPlanStats, result.subjectPlans);
      }

      this.logger.log(
        `Plan ${planId} sync completed. Created: ${result.subjects.created + result.subjectPlans.created}, Updated: ${result.subjects.updated + result.subjectPlans.updated}`,
      );

      return subjectPlans;
    } catch (error) {
      this.logger.error(`Failed to sync plan ${planId}:`, error);
      throw error;
    }
  }

  async syncCommissionsBySubject(
    subjectCode: string,
    params?: CommissionQueryParams,
  ): Promise<Commission[]> {
    this.logger.log(`Synchronizing commissions for subject: ${subjectCode}`);

    try {
      const commissions = await this.itbaApiService.getCommissionsBySubject(
        subjectCode,
        params,
      );
      const result = createDataSyncResult();

      for (const commission of commissions) {
        await this.upsertCommission(commission, result);
      }

      this.logger.log(
        `Subject ${subjectCode} commissions sync completed. Created: ${result.commissions.created}, Updated: ${result.commissions.updated}`,
      );

      return commissions;
    } catch (error) {
      this.logger.error(
        `Failed to sync commissions for subject ${subjectCode}:`,
        error,
      );
      throw error;
    }
  }

  private async syncEntities<T>(
    entities: T[],
    upsertFn: (entity: T) => Promise<SyncStats>,
  ): Promise<SyncStats> {
    let totals = createSyncStats();

    for (const entity of entities) {
      const stats = await upsertFn(entity);
      totals = addStats(stats, totals);
    }

    return totals;
  }
}

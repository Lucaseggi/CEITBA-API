import { Module } from "@nestjs/common";
import { CareerController } from "@career/web/controllers/career.controller";
import { ClassroomController } from "@career/web/controllers/classroom.controller";
import { SubjectController } from "@career/web/controllers/subject.controller";
import { SubjectPlanController } from "@career/web/controllers/subject-plan.controller";
import { DataSyncController } from "@career/web/controllers/data-sync.controller";

import { CareerService } from "@career/application/services/career.service";
import { ClassroomService } from "@career/application/services/classroom.service";
import { SubjectPlanService } from "@career/application/services/subject-plan.service";
import { SubjectService } from "@career/application/services/subject.service";
import { CommissionServiceImpl } from "@career/application/services/commission.service";
import { DataSyncService } from "@career/application/services/data-sync.service";

import { CareerRepositoryImpl } from "@career/infrastructure/repositories/career.repository.impl";
import { ClassroomRepositoryImpl } from "@career/infrastructure/repositories/classroom.repository.impl";
import { SubjectPlanRepositoryImpl } from "@career/infrastructure/repositories/subject-plan.repository.impl";
import { SubjectRepositoryImpl } from "@career/infrastructure/repositories/subject.repository.impl";
import { CommissionRepositoryImpl } from "@career/infrastructure/repositories/commission.repository.impl";
import { ItbaApiServiceImpl } from "@career/infrastructure/gateway/itba-api/itba-api.service.impl";

import { PrismaService } from "@boot/database/prisma.service";
import { CronService } from "@boot/cron/cron.service";
import { ApiFactory } from "@career/infrastructure/gateway/itba-api";

import {
  CAREER_REPOSITORY,
  CLASSROOM_REPOSITORY,
  SUBJECT_REPOSITORY,
  SUBJECT_PLAN_REPOSITORY,
  COMMISSION_REPOSITORY,
  ITBA_API_SERVICE,
  CAREER_SERVICE,
  CLASSROOM_SERVICE,
  SUBJECT_SERVICE,
  SUBJECT_PLAN_SERVICE,
  COMMISSION_SERVICE,
} from "@boot/di/injection-tokens";

@Module({
  controllers: [
    CareerController,
    ClassroomController,
    SubjectController,
    SubjectPlanController,
    DataSyncController,
  ],
  providers: [
    PrismaService,
    DataSyncService,
    CronService,

    // Services with DI tokens
    {
      provide: CAREER_SERVICE,
      useClass: CareerService,
    },
    {
      provide: CLASSROOM_SERVICE,
      useClass: ClassroomService,
    },
    {
      provide: SUBJECT_SERVICE,
      useClass: SubjectService,
    },
    {
      provide: SUBJECT_PLAN_SERVICE,
      useClass: SubjectPlanService,
    },
    {
      provide: COMMISSION_SERVICE,
      useClass: CommissionServiceImpl,
    },

    {
      provide: CAREER_REPOSITORY,
      useFactory: (prismaService: PrismaService) => {
        return new CareerRepositoryImpl(prismaService);
      },
      inject: [PrismaService],
    },
    {
      provide: CLASSROOM_REPOSITORY,
      useFactory: (prismaService: PrismaService) => {
        return new ClassroomRepositoryImpl(prismaService);
      },
      inject: [PrismaService],
    },
    {
      provide: SUBJECT_REPOSITORY,
      useFactory: (prismaService: PrismaService) => {
        return new SubjectRepositoryImpl(prismaService);
      },
      inject: [PrismaService],
    },
    {
      provide: SUBJECT_PLAN_REPOSITORY,
      useFactory: (prismaService: PrismaService) => {
        return new SubjectPlanRepositoryImpl(prismaService);
      },
      inject: [PrismaService],
    },
    {
      provide: COMMISSION_REPOSITORY,
      useFactory: (prismaService: PrismaService) => {
        return new CommissionRepositoryImpl(prismaService);
      },
      inject: [PrismaService],
    },
    {
      provide: ITBA_API_SERVICE,
      useFactory: () => {
        const ITBA_API_TOKEN = process.env.ITBA_API_TOKEN!;
        const ITBA_API_BASE_URL = process.env.ITBA_API_BASE_URL!;
        const ITBA_API_TIMEOUT = process.env.ITBA_API_TIMEOUT || "30000";

        const itbaApiClient = ApiFactory.createClient("itba-api", {
          baseUrl: ITBA_API_BASE_URL,
          timeout: parseInt(ITBA_API_TIMEOUT),
          defaultHeaders: {
            "Content-Type": "application/json",
          },
        });

        return new ItbaApiServiceImpl(ITBA_API_TOKEN, undefined, itbaApiClient);
      },
    },
  ],
  exports: [
    CAREER_SERVICE,
    CLASSROOM_SERVICE,
    SUBJECT_SERVICE,
    SUBJECT_PLAN_SERVICE,
    COMMISSION_SERVICE,
    DataSyncService,
    CronService,
  ],
})
export class ItbaModule { }

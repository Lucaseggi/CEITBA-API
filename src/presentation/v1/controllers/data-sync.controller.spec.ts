import { Test, TestingModule } from '@nestjs/testing';
import { DataSyncController } from './data-sync.controller';
import { DataSyncService, DataSyncResult } from '@/domain/itba/services/data-sync.service';
import { CronService } from '@/shared/services/cron.service';
import { createTestSubjectPlan, createTestCommission } from '../../../../test/utils/test-factories';

describe('DataSyncController', () => {
  let controller: DataSyncController;
  let dataSyncService: jest.Mocked<DataSyncService>;
  let cronService: jest.Mocked<CronService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataSyncController],
      providers: [
        {
          provide: DataSyncService,
          useValue: {
            syncAllData: jest.fn(),
            syncCommissions: jest.fn(),
            syncSubjectsByPlan: jest.fn(),
            syncCommissionsBySubject: jest.fn(),
          },
        },
        {
          provide: CronService,
          useValue: {
            updateSubjects: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DataSyncController>(DataSyncController);
    dataSyncService = module.get<DataSyncService>(DataSyncService) as jest.Mocked<DataSyncService>;
    cronService = module.get<CronService>(CronService) as jest.Mocked<CronService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncAllData', () => {
    it('should trigger full data synchronization without parameters', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 5, updated: 3, errors: 0 },
        subjectPlans: { created: 10, updated: 2, errors: 0 },
        commissions: { created: 15, updated: 5, errors: 1 },
        totalProcessed: 40,
        duration: 5000,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      const result = await controller.syncAllData();

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({ commissionParams: undefined });
      expect(result).toEqual(mockResult);
    });

    it('should trigger full data synchronization with year parameter', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 2, updated: 1, errors: 0 },
        subjectPlans: { created: 5, updated: 1, errors: 0 },
        commissions: { created: 10, updated: 2, errors: 0 },
        totalProcessed: 21,
        duration: 3000,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      const result = await controller.syncAllData(2024);

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { year: 2024 },
      });
      expect(result).toEqual(mockResult);
    });

    it('should trigger full data synchronization with period parameter', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 1, updated: 0, errors: 0 },
        subjectPlans: { created: 3, updated: 0, errors: 0 },
        commissions: { created: 5, updated: 0, errors: 0 },
        totalProcessed: 9,
        duration: 2000,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      const result = await controller.syncAllData(undefined, 'FirstSemester');

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { period: 'FirstSemester' },
      });
      expect(result).toEqual(mockResult);
    });

    it('should trigger full data synchronization with levels parameter', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 3, updated: 1, errors: 0 },
        subjectPlans: { created: 8, updated: 2, errors: 0 },
        commissions: { created: 12, updated: 3, errors: 0 },
        totalProcessed: 29,
        duration: 4500,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      const result = await controller.syncAllData(undefined, undefined, 'GRADUATE,UNDERGRADUATE');

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { levels: ['GRADUATE', 'UNDERGRADUATE'] },
      });
      expect(result).toEqual(mockResult);
    });

    it('should trigger full data synchronization with all parameters', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 4, updated: 2, errors: 0 },
        subjectPlans: { created: 9, updated: 3, errors: 0 },
        commissions: { created: 14, updated: 4, errors: 0 },
        totalProcessed: 36,
        duration: 5500,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      const result = await controller.syncAllData(2024, 'SecondSemester', 'GRADUATE');

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: {
          year: 2024,
          period: 'SecondSemester',
          levels: ['GRADUATE'],
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle invalid levels gracefully', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 100,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      await controller.syncAllData(undefined, undefined, 'INVALID,LEVELS');

      // When levels are provided but all invalid, an empty object is returned (not undefined)
      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: {},
      });
    });

    it('should filter invalid levels and keep valid ones', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 1, updated: 0, errors: 0 },
        subjectPlans: { created: 2, updated: 0, errors: 0 },
        commissions: { created: 3, updated: 0, errors: 0 },
        totalProcessed: 6,
        duration: 1500,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      await controller.syncAllData(undefined, undefined, 'GRADUATE,INVALID,UNDERGRADUATE');

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { levels: ['GRADUATE', 'UNDERGRADUATE'] },
      });
    });

    it('should handle levels with extra whitespace', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 50,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      await controller.syncAllData(undefined, undefined, ' GRADUATE , UNDERGRADUATE ');

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { levels: ['GRADUATE', 'UNDERGRADUATE'] },
      });
    });
  });

  describe('syncSubjects', () => {
    it('should trigger subjects synchronization via cron service', async () => {
      cronService.updateSubjects.mockResolvedValue(undefined);

      await controller.syncSubjects();

      expect(cronService.updateSubjects).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from cron service', async () => {
      const error = new Error('Cron sync failed');
      cronService.updateSubjects.mockRejectedValue(error);

      await expect(controller.syncSubjects()).rejects.toThrow('Cron sync failed');
    });
  });

  describe('syncCommissions', () => {
    it('should trigger commissions synchronization without parameters', async () => {
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await controller.syncCommissions();

      expect(dataSyncService.syncCommissions).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: { created: 0, updated: 0, errors: 0 },
          subjectPlans: { created: 0, updated: 0, errors: 0 },
          commissions: { created: 0, updated: 0, errors: 0 },
          totalProcessed: 0,
          duration: 0,
        }),
        undefined
      );
    });

    it('should trigger commissions synchronization with year parameter', async () => {
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await controller.syncCommissions(2024);

      expect(dataSyncService.syncCommissions).toHaveBeenCalledWith(
        expect.any(Object),
        { year: 2024 }
      );
    });

    it('should trigger commissions synchronization with all parameters', async () => {
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await controller.syncCommissions(2024, 'FirstSemester', 'GRADUATE,UNDERGRADUATE');

      expect(dataSyncService.syncCommissions).toHaveBeenCalledWith(
        expect.any(Object),
        {
          year: 2024,
          period: 'FirstSemester',
          levels: ['GRADUATE', 'UNDERGRADUATE'],
        }
      );
    });
  });

  describe('syncSubjectsByPlan', () => {
    it('should sync subjects for a specific plan', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.50', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      dataSyncService.syncSubjectsByPlan.mockResolvedValue(mockSubjectPlans);

      const result = await controller.syncSubjectsByPlan('2023');

      expect(dataSyncService.syncSubjectsByPlan).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return empty array when no subjects in plan', async () => {
      dataSyncService.syncSubjectsByPlan.mockResolvedValue([]);

      const result = await controller.syncSubjectsByPlan('2023');

      expect(result).toEqual([]);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Plan sync failed');
      dataSyncService.syncSubjectsByPlan.mockRejectedValue(error);

      await expect(controller.syncSubjectsByPlan('2023')).rejects.toThrow('Plan sync failed');
    });
  });

  describe('syncCommissionsBySubject', () => {
    it('should sync commissions for a specific subject without parameters', async () => {
      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.42', 'B'),
      ];

      dataSyncService.syncCommissionsBySubject.mockResolvedValue(mockCommissions);

      const result = await controller.syncCommissionsBySubject('93.42');

      expect(dataSyncService.syncCommissionsBySubject).toHaveBeenCalledWith('93.42', undefined);
      expect(result).toEqual(mockCommissions);
    });

    it('should sync commissions for a specific subject with year parameter', async () => {
      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];

      dataSyncService.syncCommissionsBySubject.mockResolvedValue(mockCommissions);

      const result = await controller.syncCommissionsBySubject('93.42', 2024);

      expect(dataSyncService.syncCommissionsBySubject).toHaveBeenCalledWith('93.42', {
        year: 2024,
      });
      expect(result).toEqual(mockCommissions);
    });

    it('should sync commissions for a specific subject with all parameters', async () => {
      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.42', 'B'),
      ];

      dataSyncService.syncCommissionsBySubject.mockResolvedValue(mockCommissions);

      const result = await controller.syncCommissionsBySubject(
        '93.42',
        2024,
        'SecondSemester',
        'GRADUATE'
      );

      expect(dataSyncService.syncCommissionsBySubject).toHaveBeenCalledWith('93.42', {
        year: 2024,
        period: 'SecondSemester',
        levels: ['GRADUATE'],
      });
      expect(result).toEqual(mockCommissions);
    });

    it('should return empty array when no commissions found', async () => {
      dataSyncService.syncCommissionsBySubject.mockResolvedValue([]);

      const result = await controller.syncCommissionsBySubject('93.99');

      expect(result).toEqual([]);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Subject commission sync failed');
      dataSyncService.syncCommissionsBySubject.mockRejectedValue(error);

      await expect(controller.syncCommissionsBySubject('93.42')).rejects.toThrow(
        'Subject commission sync failed'
      );
    });
  });

  describe('buildCommissionParams (implicit tests via endpoints)', () => {
    it('should return undefined when no params provided', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      await controller.syncAllData(undefined, undefined, undefined);

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: undefined,
      });
    });

    it('should build params object when some params provided', async () => {
      const mockResult: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      dataSyncService.syncAllData.mockResolvedValue(mockResult);

      await controller.syncAllData(2024, undefined, undefined);

      expect(dataSyncService.syncAllData).toHaveBeenCalledWith({
        commissionParams: { year: 2024 },
      });
    });
  });
});

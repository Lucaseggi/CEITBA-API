import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CronService } from './cron.service';
import { DataSyncService } from '@career/application/services/data-sync.service';

describe('CronService', () => {
  let service: CronService;
  let dataSyncService: jest.Mocked<DataSyncService>;

  const mockSyncResult = {
    subjects: { created: 10, updated: 5, errors: 0 },
    subjectPlans: { created: 20, updated: 8, errors: 0 },
    commissions: { created: 15, updated: 3, errors: 0 },
    duration: 1500,
    totalProcessed: 45,
  };

  beforeEach(async () => {
    const mockDataSyncService: jest.Mocked<DataSyncService> = {
      syncAllData: jest.fn(),
      syncCommissions: jest.fn(),
      syncSubjectsAndPlans: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        {
          provide: DataSyncService,
          useValue: mockDataSyncService,
        },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    dataSyncService = module.get(DataSyncService) as jest.Mocked<DataSyncService>;

    // Mock the logger to suppress output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleDataUpdate', () => {
    it('should call syncAllData and log success', async () => {
      dataSyncService.syncAllData.mockResolvedValue(mockSyncResult);

      await service.handleDataUpdate();

      expect(dataSyncService.syncAllData).toHaveBeenCalledTimes(1);
    });

    it('should log data sync result with all metrics', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      dataSyncService.syncAllData.mockResolvedValue(mockSyncResult);

      await service.handleDataUpdate();

      expect(logSpy).toHaveBeenCalledWith('Running scheduled data updates...');
      expect(logSpy).toHaveBeenCalledWith(
        'Data sync completed successfully:',
        expect.objectContaining({
          subjects: mockSyncResult.subjects,
          subjectPlans: mockSyncResult.subjectPlans,
          commissions: mockSyncResult.commissions,
          duration: `${mockSyncResult.duration}ms`,
          totalProcessed: mockSyncResult.totalProcessed,
        })
      );
    });

    it('should handle syncAllData errors gracefully', async () => {
      const error = new Error('Sync failed');
      dataSyncService.syncAllData.mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.handleDataUpdate();

      expect(errorSpy).toHaveBeenCalledWith(
        'Scheduled data update failed:',
        error
      );
    });

    it('should not throw when syncAllData fails', async () => {
      dataSyncService.syncAllData.mockRejectedValue(new Error('Sync failed'));

      // Should not throw
      await expect(service.handleDataUpdate()).resolves.toBeUndefined();
    });
  });

  describe('updateCommissions', () => {
    it('should call syncCommissions with result object', async () => {
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await service.updateCommissions();

      expect(dataSyncService.syncCommissions).toHaveBeenCalledTimes(1);
      expect(dataSyncService.syncCommissions).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: { created: 0, updated: 0, errors: 0 },
          subjectPlans: { created: 0, updated: 0, errors: 0 },
          commissions: { created: 0, updated: 0, errors: 0 },
          totalProcessed: 0,
          duration: 0,
        })
      );
    });

    it('should log commission updates started', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await service.updateCommissions();

      expect(logSpy).toHaveBeenCalledWith('Running commission updates...');
    });

    it('should log success after syncCommissions completes', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      dataSyncService.syncCommissions.mockResolvedValue(undefined);

      await service.updateCommissions();

      expect(logSpy).toHaveBeenCalledWith(
        'Commission updates completed successfully:',
        expect.any(Object)
      );
    });

    it('should throw error when syncCommissions fails', async () => {
      const error = new Error('Commission sync failed');
      dataSyncService.syncCommissions.mockRejectedValue(error);

      await expect(service.updateCommissions()).rejects.toThrow(
        'Commission sync failed'
      );
    });

    it('should log error when syncCommissions fails', async () => {
      const error = new Error('Commission sync failed');
      dataSyncService.syncCommissions.mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.updateCommissions()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        'Commission update failed:',
        error
      );
    });
  });

  describe('updateSubjects', () => {
    it('should call syncSubjectsAndPlans with result object', async () => {
      dataSyncService.syncSubjectsAndPlans.mockResolvedValue(undefined);

      await service.updateSubjects();

      expect(dataSyncService.syncSubjectsAndPlans).toHaveBeenCalledTimes(1);
      expect(dataSyncService.syncSubjectsAndPlans).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: { created: 0, updated: 0, errors: 0 },
          subjectPlans: { created: 0, updated: 0, errors: 0 },
          commissions: { created: 0, updated: 0, errors: 0 },
          totalProcessed: 0,
          duration: 0,
        })
      );
    });

    it('should log subject updates started', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      dataSyncService.syncSubjectsAndPlans.mockResolvedValue(undefined);

      await service.updateSubjects();

      expect(logSpy).toHaveBeenCalledWith('Running subject updates...');
    });

    it('should log success after syncSubjectsAndPlans completes', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      dataSyncService.syncSubjectsAndPlans.mockResolvedValue(undefined);

      await service.updateSubjects();

      expect(logSpy).toHaveBeenCalledWith(
        'Subject updates completed successfully:',
        expect.any(Object)
      );
    });

    it('should throw error when syncSubjectsAndPlans fails', async () => {
      const error = new Error('Subject sync failed');
      dataSyncService.syncSubjectsAndPlans.mockRejectedValue(error);

      await expect(service.updateSubjects()).rejects.toThrow(
        'Subject sync failed'
      );
    });

    it('should log error when syncSubjectsAndPlans fails', async () => {
      const error = new Error('Subject sync failed');
      dataSyncService.syncSubjectsAndPlans.mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.updateSubjects()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        'Subject update failed:',
        error
      );
    });
  });
});

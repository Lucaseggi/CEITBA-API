import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DataSyncService, DataSyncResult } from './data-sync.service';
import { ItbaApiServiceInterface } from '../../domain/interfaces/infrastructure/gateway/itba-api.service.interface';
import { SubjectRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/subject.repository.interface';
import { SubjectPlanRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface';
import { CommissionRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';
import { CareerRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/career.repository.interface';
import {
  CAREER_REPOSITORY,
  SUBJECT_REPOSITORY,
  SUBJECT_PLAN_REPOSITORY,
  COMMISSION_REPOSITORY,
  ITBA_API_SERVICE,
} from '@/shared/constants/injection-tokens';
import {
  createTestSubject,
  createTestSubjectPlan,
  createTestCommission,
  createTestCareer,
} from 'test/utils/test-factories';

describe('DataSyncService', () => {
  let service: DataSyncService;
  let itbaApiService: jest.Mocked<ItbaApiServiceInterface>;
  let subjectRepository: jest.Mocked<SubjectRepositoryInterface>;
  let subjectPlanRepository: jest.Mocked<SubjectPlanRepositoryInterface>;
  let commissionRepository: jest.Mocked<CommissionRepositoryInterface>;
  let careerRepository: jest.Mocked<CareerRepositoryInterface>;

  beforeEach(async () => {
    const mockItbaApiService: Partial<ItbaApiServiceInterface> = {
      getSubjectsByPlan: jest.fn(),
      getCommissions: jest.fn(),
      getCommissionsBySubject: jest.fn(),
    };

    const mockSubjectRepository: Partial<SubjectRepositoryInterface> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockSubjectPlanRepository: Partial<SubjectPlanRepositoryInterface> = {
      findByPlanAndSubject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockCommissionRepository: Partial<CommissionRepositoryInterface> = {
      findById: jest.fn(),
      upsert: jest.fn(),
    };

    const mockCareerRepository: Partial<CareerRepositoryInterface> = {
      findCareersWithPlans: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSyncService,
        {
          provide: ITBA_API_SERVICE,
          useValue: mockItbaApiService,
        },
        {
          provide: SUBJECT_REPOSITORY,
          useValue: mockSubjectRepository,
        },
        {
          provide: SUBJECT_PLAN_REPOSITORY,
          useValue: mockSubjectPlanRepository,
        },
        {
          provide: COMMISSION_REPOSITORY,
          useValue: mockCommissionRepository,
        },
        {
          provide: CAREER_REPOSITORY,
          useValue: mockCareerRepository,
        },
      ],
    }).compile();

    service = module.get<DataSyncService>(DataSyncService);
    itbaApiService = module.get(ITBA_API_SERVICE);
    subjectRepository = module.get(SUBJECT_REPOSITORY);
    subjectPlanRepository = module.get(SUBJECT_PLAN_REPOSITORY);
    commissionRepository = module.get(COMMISSION_REPOSITORY);
    careerRepository = module.get(CAREER_REPOSITORY);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncAllData', () => {
    it('should successfully sync all data and return result', async () => {
      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023']),
      };
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      itbaApiService.getCommissions.mockResolvedValue(mockCommissions);
      subjectRepository.findById.mockResolvedValue(null);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);
      commissionRepository.findById.mockResolvedValue(null);
      subjectRepository.findAll.mockResolvedValue([mockSubjectPlans[0].subject]);

      const result = await service.syncAllData();

      expect(result).toHaveProperty('subjects');
      expect(result).toHaveProperty('subjectPlans');
      expect(result).toHaveProperty('commissions');
      expect(result).toHaveProperty('totalProcessed');
      expect(result).toHaveProperty('duration');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle sync with commission parameters', async () => {
      const mockCareers = {};
      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getCommissions.mockResolvedValue([]);
      subjectRepository.findAll.mockResolvedValue([]);

      const result = await service.syncAllData({
        commissionParams: {
          year: 2024,
          period: 'FirstSemester',
          levels: ['GRADUATE'],
        },
      });

      expect(itbaApiService.getCommissions).toHaveBeenCalledWith({
        year: 2024,
        period: 'FirstSemester',
        levels: ['GRADUATE'],
      });
      expect(result.totalProcessed).toBe(0);
    });

    it('should throw error when sync fails', async () => {
      const error = new Error('Sync failed');
      careerRepository.findCareersWithPlans.mockRejectedValue(error);

      await expect(service.syncAllData()).rejects.toThrow('Sync failed');
    });

    it('should calculate total processed items correctly', async () => {
      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023']),
      };
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.50', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      itbaApiService.getCommissions.mockResolvedValue([]);
      subjectRepository.findById.mockResolvedValue(null);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);
      subjectRepository.findAll.mockResolvedValue([]);

      const result = await service.syncAllData();

      expect(result.subjects.created).toBe(2);
      expect(result.subjectPlans.created).toBe(2);
      expect(result.totalProcessed).toBe(4);
    });
  });

  describe('syncSubjectsAndPlans', () => {
    it('should sync subjects and plans for all careers', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']),
      };
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      subjectRepository.findById.mockResolvedValue(null);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      await service.syncSubjectsAndPlans(result);

      expect(careerRepository.findCareersWithPlans).toHaveBeenCalledTimes(1);
      expect(itbaApiService.getSubjectsByPlan).toHaveBeenCalledTimes(2); // 2 plans
      expect(result.subjects.created).toBe(2);
      expect(result.subjectPlans.created).toBe(2);
    });

    it('should update existing subjects when data changes', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023']),
      };
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      const existingSubject = createTestSubject('93.42', 'Old Name', 6);

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      subjectRepository.findById.mockResolvedValue(existingSubject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      await service.syncSubjectsAndPlans(result);

      expect(subjectRepository.update).toHaveBeenCalled();
      expect(result.subjects.updated).toBe(1);
    });

    it('should handle errors for individual plans and continue', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']),
      };

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan
        .mockResolvedValueOnce([createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)])
        .mockRejectedValueOnce(new Error('API error for plan 2015'));

      subjectRepository.findById.mockResolvedValue(null);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      await service.syncSubjectsAndPlans(result);

      expect(result.subjects.created).toBe(1);
      expect(result.subjectPlans.errors).toBe(1);
    });

    it('should not update subject when data is identical', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCareers = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023']),
      };
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];

      careerRepository.findCareersWithPlans.mockResolvedValue(mockCareers);
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      subjectRepository.findById.mockResolvedValue(mockSubjectPlans[0].subject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      await service.syncSubjectsAndPlans(result);

      expect(subjectRepository.update).not.toHaveBeenCalled();
      expect(result.subjects.updated).toBe(0);
    });
  });

  describe('syncCommissions', () => {
    it('should sync commissions successfully', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];
      const mockSubjects = [createTestSubject('93.42', 'Algoritmos', 6)];

      itbaApiService.getCommissions.mockResolvedValue(mockCommissions);
      subjectRepository.findAll.mockResolvedValue(mockSubjects);
      commissionRepository.findById.mockResolvedValue(null);

      await service.syncCommissions(result);

      expect(commissionRepository.upsert).toHaveBeenCalledTimes(1);
      expect(result.commissions.created).toBe(1);
    });

    it('should create missing subjects found in commissions', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.50', 'B'),
      ];

      itbaApiService.getCommissions.mockResolvedValue(mockCommissions);
      subjectRepository.findAll.mockResolvedValue([]);
      commissionRepository.findById.mockResolvedValue(null);

      await service.syncCommissions(result);

      expect(subjectRepository.create).toHaveBeenCalledTimes(2);
      expect(result.subjects.created).toBe(2);
    });

    it('should use effective commission params with defaults', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      itbaApiService.getCommissions.mockResolvedValue([]);
      subjectRepository.findAll.mockResolvedValue([]);

      await service.syncCommissions(result);

      expect(itbaApiService.getCommissions).toHaveBeenCalled();
    });

    it('should warn when no commissions returned', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      itbaApiService.getCommissions.mockResolvedValue([]);
      subjectRepository.findAll.mockResolvedValue([]);

      await service.syncCommissions(result);

      expect(result.commissions.created).toBe(0);
      expect(result.commissions.updated).toBe(0);
    });

    it('should update existing commissions when data changes', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];
      const mockSubjects = [createTestSubject('93.42', 'Algoritmos', 6)];
      const existingCommission = createTestCommission('COMM-001', '93.42', 'B');

      itbaApiService.getCommissions.mockResolvedValue(mockCommissions);
      subjectRepository.findAll.mockResolvedValue(mockSubjects);
      commissionRepository.findById.mockResolvedValue(existingCommission);

      await service.syncCommissions(result);

      expect(commissionRepository.upsert).toHaveBeenCalledTimes(1);
      expect(result.commissions.updated).toBe(1);
    });

    it('should handle errors when creating missing subjects', async () => {
      const result: DataSyncResult = {
        subjects: { created: 0, updated: 0, errors: 0 },
        subjectPlans: { created: 0, updated: 0, errors: 0 },
        commissions: { created: 0, updated: 0, errors: 0 },
        totalProcessed: 0,
        duration: 0,
      };

      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];

      itbaApiService.getCommissions.mockResolvedValue(mockCommissions);
      subjectRepository.findAll.mockResolvedValue([]);
      subjectRepository.create.mockRejectedValue(new Error('Create failed'));
      commissionRepository.findById.mockResolvedValue(null);

      await service.syncCommissions(result);

      expect(result.subjects.errors).toBe(1);
    });
  });

  describe('syncSubjectsByPlan', () => {
    it('should sync subjects for a specific plan', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.50', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      subjectRepository.findById.mockResolvedValue(null);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      const result = await service.syncSubjectsByPlan('2023');

      expect(itbaApiService.getSubjectsByPlan).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
      expect(subjectRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error when plan sync fails', async () => {
      const error = new Error('API error');
      itbaApiService.getSubjectsByPlan.mockRejectedValue(error);

      await expect(service.syncSubjectsByPlan('2023')).rejects.toThrow('API error');
    });
  });

  describe('syncCommissionsBySubject', () => {
    it('should sync commissions for a specific subject', async () => {
      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.42', 'B'),
      ];

      itbaApiService.getCommissionsBySubject.mockResolvedValue(mockCommissions);
      commissionRepository.findById.mockResolvedValue(null);

      const result = await service.syncCommissionsBySubject('93.42');

      expect(itbaApiService.getCommissionsBySubject).toHaveBeenCalledWith('93.42', undefined);
      expect(result).toEqual(mockCommissions);
      expect(commissionRepository.upsert).toHaveBeenCalledTimes(2);
    });

    it('should sync commissions with query params', async () => {
      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];
      const params = { year: 2024, period: 'FirstSemester' as const, levels: ['GRADUATE' as const] };

      itbaApiService.getCommissionsBySubject.mockResolvedValue(mockCommissions);
      commissionRepository.findById.mockResolvedValue(null);

      await service.syncCommissionsBySubject('93.42', params);

      expect(itbaApiService.getCommissionsBySubject).toHaveBeenCalledWith('93.42', params);
    });

    it('should throw error when subject commission sync fails', async () => {
      const error = new Error('API error');
      itbaApiService.getCommissionsBySubject.mockRejectedValue(error);

      await expect(service.syncCommissionsBySubject('93.42')).rejects.toThrow('API error');
    });
  });
});

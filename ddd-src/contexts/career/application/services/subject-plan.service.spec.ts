import { Test, TestingModule } from '@nestjs/testing';
import { SubjectPlanService } from './subject-plan.service';
import { SubjectPlanRepository } from '../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface';
import { SubjectRepository } from '../../domain/interfaces/infrastructure/repositories/subject.repository.interface';
import { ItbaApiService } from '../../domain/interfaces/infrastructure/gateway/itba-api.service.interface';
import { CommissionRepository } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';
import {
  SUBJECT_PLAN_REPOSITORY,
  SUBJECT_REPOSITORY,
  ITBA_API_SERVICE,
  COMMISSION_REPOSITORY,
} from '@/shared/constants/injection-tokens';
import { ValidationException, ResourceNotFoundException } from '@/shared/exceptions/domain.exceptions';
import { createTestSubjectPlan, createTestSubject, createTestCommission } from 'test/utils/test-factories';

describe('SubjectPlanService', () => {
  let service: SubjectPlanService;
  let subjectPlanRepository: jest.Mocked<SubjectPlanRepository>;
  let subjectRepository: jest.Mocked<SubjectRepository>;
  let itbaApiService: jest.Mocked<ItbaApiService>;
  let commissionRepository: jest.Mocked<CommissionRepository>;

  beforeEach(async () => {
    const mockSubjectPlanRepository: jest.Mocked<Partial<SubjectPlanRepository>> = {
      findByPlanId: jest.fn(),
      findBySubjectId: jest.fn(),
      findByPlanAndSubject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBySection: jest.fn(),
      findElectives: jest.fn(),
      findByYear: jest.fn(),
      findBySemester: jest.fn(),
      findAll: jest.fn(),
    };

    const mockSubjectRepository: jest.Mocked<Partial<SubjectRepository>> = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    const mockItbaApiService: jest.Mocked<Partial<ItbaApiService>> = {
      getSubjectsByPlan: jest.fn(),
    };

    const mockCommissionRepository: jest.Mocked<Partial<CommissionRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectPlanService,
        {
          provide: SUBJECT_PLAN_REPOSITORY,
          useValue: mockSubjectPlanRepository,
        },
        {
          provide: SUBJECT_REPOSITORY,
          useValue: mockSubjectRepository,
        },
        {
          provide: ITBA_API_SERVICE,
          useValue: mockItbaApiService,
        },
        {
          provide: COMMISSION_REPOSITORY,
          useValue: mockCommissionRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectPlanService>(SubjectPlanService);
    subjectPlanRepository = module.get(SUBJECT_PLAN_REPOSITORY);
    subjectRepository = module.get(SUBJECT_REPOSITORY);
    itbaApiService = module.get(ITBA_API_SERVICE);
    commissionRepository = module.get(COMMISSION_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubjectsByPlan', () => {
    it('should return subject plans for given plan', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023'),
        createTestSubjectPlan('93.50', '2023'),
      ];

      subjectPlanRepository.findByPlanId.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlan('2023');

      expect(subjectPlanRepository.findByPlanId).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectsByPlanWithFilters', () => {
    it('should return filtered by year and semester', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      subjectPlanRepository.findBySemester.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters('2023', { year: 1, semester: 1 });

      expect(subjectPlanRepository.findBySemester).toHaveBeenCalledWith('2023', 1, 1);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return filtered by year only', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      subjectPlanRepository.findByYear.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters('2023', { year: 1 });

      expect(subjectPlanRepository.findByYear).toHaveBeenCalledWith('2023', 1);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return filtered by section', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS')];
      subjectPlanRepository.findBySection.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters('2023', { section: 'CIENCIAS_BASICAS' });

      expect(subjectPlanRepository.findBySection).toHaveBeenCalledWith('2023', 'CIENCIAS_BASICAS');
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return elective subjects when type is elective', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.99', '2023', 'ELECTIVAS', 0, 0)];
      subjectPlanRepository.findElectives.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters('2023', { type: 'elective' });

      expect(subjectPlanRepository.findElectives).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return all when no filters provided', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023')];
      subjectPlanRepository.findByPlanId.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters('2023', {});

      expect(subjectPlanRepository.findByPlanId).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectsByPlanFromApi', () => {
    it('should fetch subject plans from external API', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023')];
      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanFromApi('2023');

      expect(itbaApiService.getSubjectsByPlan).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectPlansBySubject', () => {
    it('should return plans for given subject', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023'),
        createTestSubjectPlan('93.42', '2015'),
      ];

      subjectPlanRepository.findBySubjectId.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectPlansBySubject('93.42');

      expect(subjectPlanRepository.findBySubjectId).toHaveBeenCalledWith('93.42');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectPlan', () => {
    it('should return specific subject plan', async () => {
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023');
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(mockSubjectPlan);

      const result = await service.getSubjectPlan('2023', '93.42');

      expect(subjectPlanRepository.findByPlanAndSubject).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should return null when not found', async () => {
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      const result = await service.getSubjectPlan('2023', '99.99');

      expect(result).toBeNull();
    });
  });

  describe('createSubjectPlan', () => {
    it('should create subject plan when valid', async () => {
      const createDto = {
        subjectId: '93.42',
        planId: '2023',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 1,
        dependencies: [],
        creditsRequired: 0,
      };

      const mockSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);

      subjectRepository.findById.mockResolvedValue(mockSubject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);
      subjectPlanRepository.create.mockResolvedValue(mockSubjectPlan);

      const result = await service.createSubjectPlan(createDto);

      expect(subjectRepository.findById).toHaveBeenCalledWith('93.42');
      expect(subjectPlanRepository.findByPlanAndSubject).toHaveBeenCalledWith('2023', '93.42');
      expect(subjectPlanRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should throw ResourceNotFoundException when subject not found', async () => {
      const createDto = {
        subjectId: '99.99',
        planId: '2023',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 1,
        dependencies: [],
        creditsRequired: 0,
      };

      subjectRepository.findById.mockResolvedValue(null);

      await expect(service.createSubjectPlan(createDto)).rejects.toThrow(ResourceNotFoundException);
      expect(subjectPlanRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when subject plan already exists', async () => {
      const createDto = {
        subjectId: '93.42',
        planId: '2023',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 1,
        dependencies: [],
        creditsRequired: 0,
      };

      const mockSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const existingSubjectPlan = createTestSubjectPlan('93.42', '2023');

      subjectRepository.findById.mockResolvedValue(mockSubject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(existingSubjectPlan);

      await expect(service.createSubjectPlan(createDto)).rejects.toThrow(ValidationException);
      expect(subjectPlanRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateSubjectPlan', () => {
    it('should update subject plan when it exists', async () => {
      const existingSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      const updatedSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 2, 1);

      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(existingSubjectPlan);
      subjectPlanRepository.update.mockResolvedValue(updatedSubjectPlan);

      const result = await service.updateSubjectPlan('2023', '93.42', { year: 2 });

      expect(subjectPlanRepository.findByPlanAndSubject).toHaveBeenCalledWith('2023', '93.42');
      expect(subjectPlanRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedSubjectPlan);
    });

    it('should return null when subject plan not found', async () => {
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      const result = await service.updateSubjectPlan('2023', '99.99', { year: 2 });

      expect(subjectPlanRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteSubjectPlan', () => {
    it('should delete subject plan and return true when it exists', async () => {
      const existingSubjectPlan = createTestSubjectPlan('93.42', '2023');
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(existingSubjectPlan);
      subjectPlanRepository.delete.mockResolvedValue(undefined);

      const result = await service.deleteSubjectPlan('2023', '93.42');

      expect(subjectPlanRepository.delete).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toBe(true);
    });

    it('should return false when subject plan not found', async () => {
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      const result = await service.deleteSubjectPlan('2023', '99.99');

      expect(subjectPlanRepository.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('getSubjectsBySection', () => {
    it('should return subjects for given section', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS')];
      subjectPlanRepository.findBySection.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsBySection('2023', 'CIENCIAS_BASICAS');

      expect(subjectPlanRepository.findBySection).toHaveBeenCalledWith('2023', 'CIENCIAS_BASICAS');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getElectiveSubjects', () => {
    it('should return elective subjects', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.99', '2023', 'ELECTIVAS', 0, 0)];
      subjectPlanRepository.findElectives.mockResolvedValue(mockSubjectPlans);

      const result = await service.getElectiveSubjects('2023');

      expect(subjectPlanRepository.findElectives).toHaveBeenCalledWith('2023');
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectsByYear', () => {
    it('should return subjects for given year', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1)];
      subjectPlanRepository.findByYear.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByYear('2023', 1);

      expect(subjectPlanRepository.findByYear).toHaveBeenCalledWith('2023', 1);
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectsBySemester', () => {
    it('should return subjects for given semester', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      subjectPlanRepository.findBySemester.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsBySemester('2023', 1, 1);

      expect(subjectPlanRepository.findBySemester).toHaveBeenCalledWith('2023', 1, 1);
      expect(result).toEqual(mockSubjectPlans);
    });
  });

  describe('getSubjectDependencies', () => {
    it('should return dependencies for subject', async () => {
      const subjectPlan = createTestSubjectPlan('93.43', '2023', 'CIENCIAS_BASICAS', 1, 2, ['93.42'], 0);
      const depSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);

      subjectPlanRepository.findByPlanAndSubject
        .mockResolvedValueOnce(subjectPlan)
        .mockResolvedValueOnce(depSubjectPlan);

      const result = await service.getSubjectDependencies('2023', '93.43');

      expect(result).toHaveLength(1);
      expect(result[0].subjectId).toBe('93.42');
    });

    it('should return empty array when subject has no dependencies', async () => {
      const subjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1, []);

      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(subjectPlan);

      const result = await service.getSubjectDependencies('2023', '93.42');

      expect(result).toEqual([]);
    });

    it('should return empty array when subject plan not found', async () => {
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);

      const result = await service.getSubjectDependencies('2023', '99.99');

      expect(result).toEqual([]);
    });
  });

  describe('getSubjectsByPlanOrganized', () => {
    it('should return organized subjects by section, year, semester', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      const mockCommissions = [createTestCommission('COMM-001', '93.42', 'A')];

      itbaApiService.getSubjectsByPlan.mockResolvedValue(mockSubjectPlans);
      commissionRepository.findAll.mockResolvedValue(mockCommissions);

      const result = await service.getSubjectsByPlanOrganized('2023');

      expect(result['CIENCIAS_BASICAS']).toBeDefined();
      expect(result['CIENCIAS_BASICAS']['1']['1']).toHaveLength(1);
    });

    it('should return empty object when no subject plans exist', async () => {
      itbaApiService.getSubjectsByPlan.mockResolvedValue([]);

      const result = await service.getSubjectsByPlanOrganized('2023');

      expect(result).toEqual({});
    });
  });
});

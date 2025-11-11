import { Test, TestingModule } from '@nestjs/testing';
import { SubjectPlanService } from './subject-plan.service';
import { SubjectPlanRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/subject-plan.repository.interface';
import { SubjectRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/subject.repository.interface';
import { SubjectPlanFilters } from '../../domain/entity/subject-plan-filters';
import {
  SUBJECT_PLAN_REPOSITORY,
  SUBJECT_REPOSITORY,
} from '@boot/di/injection-tokens';
import { ValidationException, ResourceNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { createTestSubjectPlan, createTestSubject } from 'test/utils/test-factories';

describe('SubjectPlanService', () => {
  let service: SubjectPlanService;
  let subjectPlanRepository: jest.Mocked<SubjectPlanRepositoryInterface>;
  let subjectRepository: jest.Mocked<SubjectRepositoryInterface>;

  beforeEach(async () => {
    const mockSubjectPlanRepository: jest.Mocked<Partial<SubjectPlanRepositoryInterface>> = {
      find: jest.fn(),
      findByPlanAndSubject: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    const mockSubjectRepository: jest.Mocked<Partial<SubjectRepositoryInterface>> = {
      findById: jest.fn(),
      findByIds: jest.fn(),
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
      ],
    }).compile();

    service = module.get<SubjectPlanService>(SubjectPlanService);
    subjectPlanRepository = module.get(SUBJECT_PLAN_REPOSITORY);
    subjectRepository = module.get(SUBJECT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubjectsByPlanWithFilters', () => {
    it('should call repository.find() with year and semester filters', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      const filters = new SubjectPlanFilters('2023', undefined, undefined, 1, 1);
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should call repository.find() with year filter only', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      const filters = new SubjectPlanFilters('2023', undefined, undefined, 1);
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should call repository.find() with section filter', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS')];
      const filters = new SubjectPlanFilters('2023', undefined, 'CIENCIAS_BASICAS');
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should call repository.find() with electivesOnly flag', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.99', '2023', 'ELECTIVAS', 0, 0)];
      const filters = new SubjectPlanFilters('2023', undefined, undefined, undefined, undefined, true);
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should call repository.find() with planId only when no filters provided', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023')];
      const filters = new SubjectPlanFilters('2023');
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should call repository.find() with semester filter only', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 2)];
      const filters = new SubjectPlanFilters('2023', undefined, undefined, undefined, 2);
      subjectPlanRepository.find.mockResolvedValue(mockSubjectPlans);

      const result = await service.getSubjectsByPlanWithFilters(filters);

      expect(subjectPlanRepository.find).toHaveBeenCalledWith(filters);
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
      const mockSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);

      subjectRepository.findById.mockResolvedValue(mockSubject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(null);
      subjectPlanRepository.create.mockResolvedValue(mockSubjectPlan);

      const result = await service.createSubjectPlan(
        '93.42',
        '2023',
        'CIENCIAS_BASICAS',
        1,
        1,
        [],
        0
      );

      expect(subjectRepository.findById).toHaveBeenCalledWith('93.42');
      expect(subjectPlanRepository.findByPlanAndSubject).toHaveBeenCalledWith('2023', '93.42');
      expect(subjectPlanRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should throw ResourceNotFoundException when subject not found', async () => {
      subjectRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSubjectPlan('99.99', '2023', 'CIENCIAS_BASICAS', 1, 1, [], 0)
      ).rejects.toThrow(ResourceNotFoundException);
      expect(subjectPlanRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when subject plan already exists', async () => {
      const mockSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const existingSubjectPlan = createTestSubjectPlan('93.42', '2023');

      subjectRepository.findById.mockResolvedValue(mockSubject);
      subjectPlanRepository.findByPlanAndSubject.mockResolvedValue(existingSubjectPlan);

      await expect(
        service.createSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1, [], 0)
      ).rejects.toThrow(ValidationException);
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
});

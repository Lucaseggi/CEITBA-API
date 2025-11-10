import { Test, TestingModule } from '@nestjs/testing';
import { CareerService } from './career.service';
import { CareerRepository } from '../../domain/interfaces/infrastructure/repositories/career.repository.interface';
import { Career } from '../../domain/entity/career.model';
import { CAREER_REPOSITORY } from '@/shared/constants/injection-tokens';
import { createTestCareer } from 'test/utils/test-factories';

describe('CareerService', () => {
  let service: CareerService;
  let repository: jest.Mocked<CareerRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CareerRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findCareersWithPlans: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareerService,
        {
          provide: CAREER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CareerService>(CareerService);
    repository = module.get(CAREER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCareers', () => {
    it('should return all careers from repository', async () => {
      const mockCareers = [
        createTestCareer('I', 'Ingeniería Informática', ['2023']),
        createTestCareer('E', 'Ingeniería Electrónica', ['2020']),
      ];

      repository.findAll.mockResolvedValue(mockCareers);

      const result = await service.getAllCareers();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCareers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no careers exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getAllCareers();

      expect(result).toEqual([]);
    });
  });

  describe('getCareerById', () => {
    it('should return career when found', async () => {
      const mockCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      repository.findById.mockResolvedValue(mockCareer);

      const result = await service.getCareerById('I');

      expect(repository.findById).toHaveBeenCalledWith('I');
      expect(result).toEqual(mockCareer);
    });

    it('should return null when career not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.getCareerById('NON_EXISTENT');

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('createCareer', () => {
    it('should create and return new career', async () => {
      const createDto = {
        id: 'I',
        name: 'Ingeniería Informática',
      };

      const expectedCareer = createTestCareer('I', 'Ingeniería Informática', []);
      repository.create.mockResolvedValue(expectedCareer);

      const result = await service.createCareer(createDto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'I',
          name: 'Ingeniería Informática',
          plans: [],
        })
      );
      expect(result).toEqual(expectedCareer);
    });

    it('should pass domain model to repository', async () => {
      const createDto = {
        id: 'E',
        name: 'Ingeniería Electrónica',
      };

      const mockCareer = createTestCareer('E', 'Ingeniería Electrónica', []);
      repository.create.mockResolvedValue(mockCareer);

      await service.createCareer(createDto);

      const calledArg = repository.create.mock.calls[0][0];
      expect(calledArg).toBeInstanceOf(Career);
      expect(calledArg.id).toBe('E');
      expect(calledArg.name).toBe('Ingeniería Electrónica');
      expect(calledArg.plans).toEqual([]);
    });
  });

  describe('updateCareer', () => {
    it('should update and return career when it exists', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      const updatedCareer = createTestCareer('I', 'Ingeniería Informática Updated', ['2023']);

      repository.findById.mockResolvedValue(existingCareer);
      repository.update.mockResolvedValue(updatedCareer);

      const result = await service.updateCareer('I', {
        name: 'Ingeniería Informática Updated',
      });

      expect(repository.findById).toHaveBeenCalledWith('I');
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCareer);
    });

    it('should return null when career does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.updateCareer('NON_EXISTENT', {
        name: 'Test',
      });

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should update only name when provided', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      const updatedCareer = createTestCareer('I', 'Ingeniería Informática Updated', ['2023']);

      repository.findById.mockResolvedValue(existingCareer);
      repository.update.mockResolvedValue(updatedCareer);

      await service.updateCareer('I', { name: 'Ingeniería Informática Updated' });

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'I',
          name: 'Ingeniería Informática Updated',
          plans: ['2023'], // Should preserve existing plans
        })
      );
    });

    it('should preserve existing name when not provided', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);

      repository.findById.mockResolvedValue(existingCareer);
      repository.update.mockResolvedValue(existingCareer);

      await service.updateCareer('I', {});

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'I',
          name: 'Ingeniería Informática',
        })
      );
    });
  });

  describe('deleteCareer', () => {
    it('should delete career and return true when it exists', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      repository.findById.mockResolvedValue(existingCareer);
      repository.delete.mockResolvedValue(undefined);

      const result = await service.deleteCareer('I');

      expect(repository.findById).toHaveBeenCalledWith('I');
      expect(repository.delete).toHaveBeenCalledWith('I');
      expect(result).toBe(true);
    });

    it('should return false when career does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.deleteCareer('NON_EXISTENT');

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(repository.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('getCareersWithPlans', () => {
    it('should return careers with their plans', async () => {
      const mockCareersWithPlans = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']),
        E: createTestCareer('E', 'Ingeniería Electrónica', ['2020']),
      };

      repository.findCareersWithPlans.mockResolvedValue(mockCareersWithPlans);

      const result = await service.getCareersWithPlans();

      expect(repository.findCareersWithPlans).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCareersWithPlans);
      expect(result['I'].plans).toEqual(['2023', '2015']);
    });

    it('should return empty object when no careers exist', async () => {
      repository.findCareersWithPlans.mockResolvedValue({});

      const result = await service.getCareersWithPlans();

      expect(result).toEqual({});
    });
  });

  describe('addPlanToCareer', () => {
    it('should add plan to career and return updated career', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      const updatedCareer = createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']);

      repository.findById.mockResolvedValue(existingCareer);
      repository.update.mockResolvedValue(updatedCareer);

      const result = await service.addPlanToCareer('I', '2015');

      expect(repository.findById).toHaveBeenCalledWith('I');
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCareer);
      expect(result?.plans).toContain('2015');
    });

    it('should return null when career does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.addPlanToCareer('NON_EXISTENT', '2023');

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('removePlanFromCareer', () => {
    it('should remove plan from career and return updated career', async () => {
      const existingCareer = createTestCareer('I', 'Ingeniería Informática', ['2023', '2015']);
      const updatedCareer = createTestCareer('I', 'Ingeniería Informática', ['2023']);

      repository.findById.mockResolvedValue(existingCareer);
      repository.update.mockResolvedValue(updatedCareer);

      const result = await service.removePlanFromCareer('I', '2015');

      expect(repository.findById).toHaveBeenCalledWith('I');
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCareer);
      expect(result?.plans).not.toContain('2015');
    });

    it('should return null when career does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.removePlanFromCareer('NON_EXISTENT', '2023');

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubjectPlanController } from './subject-plan.controller';
import { createTestSubjectPlan } from 'test/utils/test-factories';
import { SubjectPlanQueryDto, CreateSubjectPlanDto, UpdateSubjectPlanDto } from '../dtos/subject-plan.dto';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { ResourceNotFoundException, ValidationException } from '../../domain/exceptions/domain.exceptions';
import { ForeignKeyConstraintViolationException } from '../../domain/exceptions/itba.exceptions';

describe('SubjectPlanController', () => {
  let controller: SubjectPlanController;
  let service: jest.Mocked<SubjectPlanServiceInterface>;
  beforeEach(() => {
    service = {
      getSubjectsByPlanWithFilters: jest.fn(),
      getSubjectPlansBySubject: jest.fn(),
      getSubjectPlan: jest.fn(),
      createSubjectPlan: jest.fn(),
      updateSubjectPlan: jest.fn(),
      deleteSubjectPlan: jest.fn(),
    } as unknown as jest.Mocked<SubjectPlanServiceInterface>;

    controller = new SubjectPlanController(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubjectsByPlan', () => {
    it('should return subjects for plan with filters', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.50', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: SubjectPlanQueryDto = { year: 1, semester: 1, section: 'CIENCIAS_BASICAS' };
      const result = await controller.getSubjectsByPlan('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: 1,
        semester: 1,
        section: 'CIENCIAS_BASICAS',
        type: undefined,
      });
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return subjects with undefined filters when no query params provided', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: SubjectPlanQueryDto = {};
      const result = await controller.getSubjectsByPlan('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: undefined,
        semester: undefined,
        section: undefined,
        type: undefined,
      });
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return empty array when no subjects match filters', async () => {
      service.getSubjectsByPlanWithFilters.mockResolvedValue([]);

      const query: SubjectPlanQueryDto = { year: 5 };
      const result = await controller.getSubjectsByPlan('2023', query);

      expect(result).toEqual([]);
    });

    it('should handle type filter', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: SubjectPlanQueryDto = { type: 'elective' };
      await controller.getSubjectsByPlan('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: undefined,
        semester: undefined,
        section: undefined,
        type: 'elective',
      });
    });

    it('should throw NotFoundException when ResourceNotFoundException is thrown by service', async () => {
      const query: SubjectPlanQueryDto = { year: 1 };
      service.getSubjectsByPlanWithFilters.mockRejectedValue(
        new ResourceNotFoundException('Plan', '9999')
      );

      await expect(controller.getSubjectsByPlan('9999', query)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.getSubjectsByPlan('9999', query)).rejects.toThrow(
        "Plan with identifier '9999' not found"
      );
    });

    it('should re-throw non-ResourceNotFoundException errors', async () => {
      const query: SubjectPlanQueryDto = { year: 1 };
      const genericError = new Error('Database connection failed');
      service.getSubjectsByPlanWithFilters.mockRejectedValue(genericError);

      await expect(controller.getSubjectsByPlan('2023', query)).rejects.toThrow(
        'Database connection failed'
      );
      await expect(controller.getSubjectsByPlan('2023', query)).rejects.not.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSubjectPlansBySubject', () => {
    it('should return all plans for a subject', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.42', '2015', 'CIENCIAS_BASICAS', 1, 1),
      ];

      service.getSubjectPlansBySubject.mockResolvedValue(mockSubjectPlans);

      const result = await controller.getSubjectPlansBySubject('93.42');

      expect(service.getSubjectPlansBySubject).toHaveBeenCalledWith('93.42');
      expect(result).toEqual(mockSubjectPlans);
    });

    it('should return empty array when subject has no plans', async () => {
      service.getSubjectPlansBySubject.mockResolvedValue([]);

      const result = await controller.getSubjectPlansBySubject('99.99');

      expect(result).toEqual([]);
    });
  });

  describe('getSubjectPlan', () => {
    it('should return subject plan when found', async () => {
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      service.getSubjectPlan.mockResolvedValue(mockSubjectPlan);

      const result = await controller.getSubjectPlan('2023', '93.42');

      expect(service.getSubjectPlan).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      service.getSubjectPlan.mockResolvedValue(null);

      await expect(controller.getSubjectPlan('2023', 'NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.getSubjectPlan('2023', 'NON_EXISTENT')).rejects.toThrow(
        'Subject plan not found'
      );
    });
  });

  describe('createSubjectPlan', () => {
    it('should create and return new subject plan', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 1,
        dependencies: ['93.41'],
        creditsRequired: 0,
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);

      const result = await controller.createSubjectPlan('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith({
        ...createDto,
        planId: '2023',
      });
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should create subject plan with null values for optional fields when not provided', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', null, null);
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.createSubjectPlan('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith({
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
        planId: '2023',
        year: null,
        semester: null,
        creditsRequired: null,
        dependencies: [],
      });
    });

    it('should handle dependencies array', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
        dependencies: ['93.40', '93.41'],
        year: 2,
        semester: 1,
        creditsRequired: 20,
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 2, 1);
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.createSubjectPlan('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith({
        ...createDto,
        planId: '2023',
      });
    });

    it('should throw BadRequestException when ResourceNotFoundException is thrown', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: 'NON_EXISTENT',
        section: 'CIENCIAS_BASICAS',
      };

      service.createSubjectPlan.mockRejectedValue(
        new ResourceNotFoundException('Subject', 'NON_EXISTENT')
      );

      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        "Subject with identifier 'NON_EXISTENT' not found"
      );
    });

    it('should throw BadRequestException when ValidationException is thrown', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'INVALID_SECTION',
      };

      service.createSubjectPlan.mockRejectedValue(
        new ValidationException('section', 'INVALID_SECTION', 'Invalid section name')
      );

      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        "Validation failed for field 'section' with value 'INVALID_SECTION': Invalid section name"
      );
    });

    it('should throw BadRequestException when ForeignKeyConstraintViolationException is thrown', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
        dependencies: ['99.99'],
      };

      service.createSubjectPlan.mockRejectedValue(
        new ForeignKeyConstraintViolationException('Dependency subject 99.99 does not exist')
      );

      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        'Dependency subject 99.99 does not exist'
      );
    });

    it('should re-throw unexpected errors', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
      };

      const genericError = new Error('Unexpected database error');
      service.createSubjectPlan.mockRejectedValue(genericError);

      await expect(controller.createSubjectPlan('2023', createDto)).rejects.toThrow(
        'Unexpected database error'
      );
      await expect(controller.createSubjectPlan('2023', createDto)).rejects.not.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateSubjectPlan', () => {
    it('should update and return subject plan when found', async () => {
      const updateDto: UpdateSubjectPlanDto = {
        section: 'ESPECIALIZACION',
        year: 3,
        semester: 2,
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'ESPECIALIZACION', 3, 2);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      const result = await controller.updateSubjectPlan('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
      expect(result).toEqual(mockSubjectPlan);
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      service.updateSubjectPlan.mockResolvedValue(null);

      await expect(
        controller.updateSubjectPlan('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.updateSubjectPlan('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow('Subject plan not found');
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 4 };
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 4, 1);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.updateSubjectPlan('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
    });

    it('should handle updating dependencies', async () => {
      const updateDto: UpdateSubjectPlanDto = {
        dependencies: ['93.40', '93.41', '93.43'],
      };
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.updateSubjectPlan('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
    });

    it('should throw NotFoundException when ResourceNotFoundException is thrown by service', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      service.updateSubjectPlan.mockRejectedValue(
        new ResourceNotFoundException('SubjectPlan', '2023-NON_EXISTENT')
      );

      await expect(
        controller.updateSubjectPlan('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.updateSubjectPlan('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow("SubjectPlan with identifier '2023-NON_EXISTENT' not found");
    });

    it('should throw BadRequestException when ValidationException is thrown by service', async () => {
      const updateDto: UpdateSubjectPlanDto = {
        year: -1
      };
      service.updateSubjectPlan.mockRejectedValue(
        new ValidationException('year', -1, 'Year must be positive')
      );

      await expect(
        controller.updateSubjectPlan('2023', '93.42', updateDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.updateSubjectPlan('2023', '93.42', updateDto)
      ).rejects.toThrow("Validation failed for field 'year' with value '-1': Year must be positive");
    });

    it('should re-throw unexpected errors', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      const genericError = new Error('Database transaction failed');
      service.updateSubjectPlan.mockRejectedValue(genericError);

      await expect(
        controller.updateSubjectPlan('2023', '93.42', updateDto)
      ).rejects.toThrow('Database transaction failed');
      await expect(
        controller.updateSubjectPlan('2023', '93.42', updateDto)
      ).rejects.not.toThrow(NotFoundException);
      await expect(
        controller.updateSubjectPlan('2023', '93.42', updateDto)
      ).rejects.not.toThrow(BadRequestException);
    });
  });

  describe('deleteSubjectPlan', () => {
    it('should delete subject plan when found', async () => {
      service.deleteSubjectPlan.mockResolvedValue(true);

      const result = await controller.deleteSubjectPlan('2023', '93.42');

      expect(service.deleteSubjectPlan).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      service.deleteSubjectPlan.mockResolvedValue(false);

      await expect(controller.deleteSubjectPlan('2023', 'NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.deleteSubjectPlan('2023', 'NON_EXISTENT')).rejects.toThrow(
        'Subject plan not found'
      );
    });

    it('should throw NotFoundException when ResourceNotFoundException is thrown by service', async () => {
      service.deleteSubjectPlan.mockRejectedValue(
        new ResourceNotFoundException('SubjectPlan', '2023-99.99')
      );

      await expect(controller.deleteSubjectPlan('2023', '99.99')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.deleteSubjectPlan('2023', '99.99')).rejects.toThrow(
        "SubjectPlan with identifier '2023-99.99' not found"
      );
    });

    it('should re-throw unexpected errors', async () => {
      const genericError = new Error('Cannot delete due to constraint');
      service.deleteSubjectPlan.mockRejectedValue(genericError);

      await expect(controller.deleteSubjectPlan('2023', '93.42')).rejects.toThrow(
        'Cannot delete due to constraint'
      );
      await expect(controller.deleteSubjectPlan('2023', '93.42')).rejects.not.toThrow(
        NotFoundException
      );
    });
  });
});

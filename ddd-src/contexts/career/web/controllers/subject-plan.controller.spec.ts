import { NotFoundException } from '@nestjs/common';
import { SubjectPlanController } from './subject-plan.controller';
import { createTestSubjectPlan } from 'test/utils/test-factories';
import { GetSubjectsByPlanQueryDto } from '../dtos/get-subjects-by-plan-query.dto';
import { CreateSubjectPlanDto, UpdateSubjectPlanDto } from '../dtos/subject-plan.dto';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';

describe('SubjectPlanController', () => {
  let controller: SubjectPlanController;
  let service: jest.Mocked<SubjectPlanServiceInterface>;
  beforeEach(() => {
    service = {
      getSubjectsByPlanWithFilters: jest.fn(),
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

  describe('list', () => {
    it('should return subjects for plan with filters', async () => {
      const mockSubjectPlans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.50', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: GetSubjectsByPlanQueryDto = { year: 1, semester: 1, section: 'CIENCIAS_BASICAS' };
      const result = await controller.list('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: 1,
        semester: 1,
        section: 'CIENCIAS_BASICAS',
        electivesOnly: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0].subjectId).toEqual('93.42');
      expect(result[1].subjectId).toEqual('93.50');
    });

    it('should return subjects with undefined filters when no query params provided', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)];
      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: GetSubjectsByPlanQueryDto = {};
      const result = await controller.list('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: undefined,
        semester: undefined,
        section: undefined,
        electivesOnly: undefined,
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no subjects match filters', async () => {
      service.getSubjectsByPlanWithFilters.mockResolvedValue([]);

      const query: GetSubjectsByPlanQueryDto = { year: 5 };
      const result = await controller.list('2023', query);

      expect(result).toEqual([]);
    });

    it('should handle electivesOnly filter', async () => {
      const mockSubjectPlans = [createTestSubjectPlan('93.42', '2023', 'ELECTIVAS', 0, 0)];
      service.getSubjectsByPlanWithFilters.mockResolvedValue(mockSubjectPlans);

      const query: GetSubjectsByPlanQueryDto = { electivesOnly: true };
      await controller.list('2023', query);

      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalledWith('2023', {
        year: undefined,
        semester: undefined,
        section: undefined,
        electivesOnly: true,
      });
    });
  });

  describe('findOne', () => {
    it('should return subject plan when found', async () => {
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      service.getSubjectPlan.mockResolvedValue(mockSubjectPlan);

      const result = await controller.findOne('2023', '93.42');

      expect(service.getSubjectPlan).toHaveBeenCalledWith('2023', '93.42');
      expect(result.subjectId).toEqual('93.42');
      expect(result.planId).toEqual('2023');
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      service.getSubjectPlan.mockResolvedValue(null);

      await expect(controller.findOne('2023', 'NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.findOne('2023', 'NON_EXISTENT')).rejects.toThrow(
        'Subject plan not found'
      );
    });
  });

  describe('create', () => {
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

      const result = await controller.create('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith(
        '93.42',
        '2023',
        'CIENCIAS_BASICAS',
        1,
        1,
        ['93.41'],
        0
      );
      expect(result.subjectId).toEqual('93.42');
      expect(result.planId).toEqual('2023');
    });

    it('should create subject plan with null values for optional fields when not provided', async () => {
      const createDto: CreateSubjectPlanDto = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', null, null);
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.create('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith(
        '93.42',
        '2023',
        'CIENCIAS_BASICAS',
        null,
        null,
        [],
        null
      );
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

      await controller.create('2023', createDto);

      expect(service.createSubjectPlan).toHaveBeenCalledWith(
        '93.42',
        '2023',
        'CIENCIAS_BASICAS',
        2,
        1,
        ['93.40', '93.41'],
        20
      );
    });
  });

  describe('update', () => {
    it('should update and return subject plan when found', async () => {
      const updateDto: UpdateSubjectPlanDto = {
        section: 'ESPECIALIZACION',
        year: 3,
        semester: 2,
      };

      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'ESPECIALIZACION', 3, 2);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      const result = await controller.update('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
      expect(result.subjectId).toEqual('93.42');
      expect(result.section).toEqual('ESPECIALIZACION');
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      service.updateSubjectPlan.mockResolvedValue(null);

      await expect(
        controller.update('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('2023', 'NON_EXISTENT', updateDto)
      ).rejects.toThrow('Subject plan not found');
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 4 };
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 4, 1);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.update('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
    });

    it('should handle updating dependencies', async () => {
      const updateDto: UpdateSubjectPlanDto = {
        dependencies: ['93.40', '93.41', '93.43'],
      };
      const mockSubjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      service.updateSubjectPlan.mockResolvedValue(mockSubjectPlan);

      await controller.update('2023', '93.42', updateDto);

      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete subject plan when found', async () => {
      service.deleteSubjectPlan.mockResolvedValue(true);

      const result = await controller.remove('2023', '93.42');

      expect(service.deleteSubjectPlan).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      service.deleteSubjectPlan.mockResolvedValue(false);

      await expect(controller.remove('2023', 'NON_EXISTENT')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.remove('2023', 'NON_EXISTENT')).rejects.toThrow(
        'Subject plan not found'
      );
    });
  });
});

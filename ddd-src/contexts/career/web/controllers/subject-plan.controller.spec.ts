import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubjectPlanController } from './subject-plan.controller';
import { GetSubjectsByPlanQueryDto } from '../dtos/get-subjects-by-plan-query.dto';
import { CreateSubjectPlanDto, UpdateSubjectPlanDto } from '../dtos/subject-plan.dto';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { SubjectPlanFilters } from '../../domain/entity/subject-plan-filters';
import { SUBJECT_PLAN_SERVICE } from '@boot/di/injection-tokens';
import { ResourceNotFoundException, ValidationException } from '../../domain/exceptions/domain.exceptions';
import { ForeignKeyConstraintViolationException } from '../../domain/exceptions/itba.exceptions';
import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';

describe('SubjectPlanController', () => {
  let controller: SubjectPlanController;
  let service: jest.Mocked<SubjectPlanServiceInterface>;

  const mockSubject = new Subject('93.42', 'Cálculo I', 6);
  const mockSubjectPlan = new SubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1, [], 0, mockSubject);

  beforeEach(async () => {
    const mockService: jest.Mocked<SubjectPlanServiceInterface> = {
      getSubjectsByPlanWithFilters: jest.fn(),
      getSubjectPlan: jest.fn(),
      createSubjectPlan: jest.fn(),
      updateSubjectPlan: jest.fn(),
      deleteSubjectPlan: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectPlanController],
      providers: [{ provide: SUBJECT_PLAN_SERVICE, useValue: mockService }],
    }).compile();

    controller = module.get<SubjectPlanController>(SubjectPlanController);
    service = module.get(SUBJECT_PLAN_SERVICE) as jest.Mocked<SubjectPlanServiceInterface>;
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('should return subjects for plan with filters', async () => {
      service.getSubjectsByPlanWithFilters.mockResolvedValue([mockSubjectPlan]);
      const query: GetSubjectsByPlanQueryDto = { year: 1, semester: 1, section: 'CIENCIAS_BASICAS' };
      const result = await controller.list('2023', query);
      expect(service.getSubjectsByPlanWithFilters).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no subjects match filters', async () => {
      service.getSubjectsByPlanWithFilters.mockResolvedValue([]);
      const query: GetSubjectsByPlanQueryDto = { year: 5 };
      const result = await controller.list('2023', query);
      expect(result).toEqual([]);
    });

    it('should catch ResourceNotFoundException and throw NotFoundException', async () => {
      service.getSubjectsByPlanWithFilters.mockRejectedValue(new ResourceNotFoundException('Plan', 'INVALID'));
      const query: GetSubjectsByPlanQueryDto = {};
      await expect(controller.list('INVALID', query)).rejects.toThrow(NotFoundException);
    });

    it('should pass through non-ResourceNotFoundException errors', async () => {
      const error = new Error('Database error');
      service.getSubjectsByPlanWithFilters.mockRejectedValue(error);
      const query: GetSubjectsByPlanQueryDto = {};
      await expect(controller.list('2023', query)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return subject plan when found', async () => {
      service.getSubjectPlan.mockResolvedValue(mockSubjectPlan);
      const result = await controller.findOne('2023', '93.42');
      expect(service.getSubjectPlan).toHaveBeenCalledWith('2023', '93.42');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      service.getSubjectPlan.mockResolvedValue(null);
      await expect(controller.findOne('2023', 'NON_EXISTENT')).rejects.toThrow(NotFoundException);
      await expect(controller.findOne('2023', 'NON_EXISTENT')).rejects.toThrow('Subject plan not found');
    });
  });

  describe('create', () => {
    it('should create and return new subject plan', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: '93.42', section: 'CIENCIAS_BASICAS', year: 1, semester: 1, dependencies: ['93.41'], creditsRequired: 0 };
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);
      const result = await controller.create('2023', createDto);
      expect(service.createSubjectPlan).toHaveBeenCalledWith('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1, ['93.41'], 0);
      expect(result).toBeDefined();
    });

    it('should handle ResourceNotFoundException and throw BadRequestException', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: 'INVALID', section: 'CIENCIAS_BASICAS' };
      service.createSubjectPlan.mockRejectedValue(new ResourceNotFoundException('Subject', 'INVALID'));
      await expect(controller.create('2023', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle ValidationException and throw BadRequestException', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: '93.42', section: '' };
      service.createSubjectPlan.mockRejectedValue(new ValidationException('section', '', 'Section cannot be empty'));
      await expect(controller.create('2023', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle ForeignKeyConstraintViolationException and throw BadRequestException', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: '93.42', section: 'CIENCIAS_BASICAS' };
      service.createSubjectPlan.mockRejectedValue(new ForeignKeyConstraintViolationException('Plan'));
      await expect(controller.create('2023', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should pass through other errors', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: '93.42', section: 'CIENCIAS_BASICAS' };
      const error = new Error('Unexpected error');
      service.createSubjectPlan.mockRejectedValue(error);
      await expect(controller.create('2023', createDto)).rejects.toThrow(error);
    });

    it('should handle null optional fields', async () => {
      const createDto: CreateSubjectPlanDto = { subjectId: '93.42', section: 'CIENCIAS_BASICAS' };
      service.createSubjectPlan.mockResolvedValue(mockSubjectPlan);
      await controller.create('2023', createDto);
      expect(service.createSubjectPlan).toHaveBeenCalledWith('93.42', '2023', 'CIENCIAS_BASICAS', null, null, [], null);
    });
  });

  describe('update', () => {
    it('should update and return subject plan when found', async () => {
      const updateDto: UpdateSubjectPlanDto = { section: 'ESPECIALIZACION', year: 3, semester: 2 };
      const updatedPlan = new SubjectPlan('93.42', '2023', 'ESPECIALIZACION', 3, 2, [], 0, mockSubject);
      service.updateSubjectPlan.mockResolvedValue(updatedPlan);
      const result = await controller.update('2023', '93.42', updateDto);
      expect(service.updateSubjectPlan).toHaveBeenCalledWith('2023', '93.42', updateDto);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when subject plan not found', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      service.updateSubjectPlan.mockResolvedValue(null);
      await expect(controller.update('2023', 'NON_EXISTENT', updateDto)).rejects.toThrow(NotFoundException);
      await expect(controller.update('2023', 'NON_EXISTENT', updateDto)).rejects.toThrow('Subject plan not found');
    });

    it('should handle ResourceNotFoundException and throw NotFoundException', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      service.updateSubjectPlan.mockRejectedValue(new ResourceNotFoundException('SubjectPlan', 'INVALID'));
      await expect(controller.update('2023', 'INVALID', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle ValidationException and throw BadRequestException', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: -1 };
      service.updateSubjectPlan.mockRejectedValue(new ValidationException('year', -1, 'Year must be positive'));
      await expect(controller.update('2023', '93.42', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should pass through other errors', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 2 };
      const error = new Error('Database error');
      service.updateSubjectPlan.mockRejectedValue(error);
      await expect(controller.update('2023', '93.42', updateDto)).rejects.toThrow(error);
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateSubjectPlanDto = { year: 4 };
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
      await expect(controller.remove('2023', 'NON_EXISTENT')).rejects.toThrow(NotFoundException);
      await expect(controller.remove('2023', 'NON_EXISTENT')).rejects.toThrow('Subject plan not found');
    });

    it('should handle ResourceNotFoundException and throw NotFoundException', async () => {
      service.deleteSubjectPlan.mockRejectedValue(new ResourceNotFoundException('SubjectPlan', 'INVALID'));
      await expect(controller.remove('2023', 'INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should pass through other errors', async () => {
      const error = new Error('Database error');
      service.deleteSubjectPlan.mockRejectedValue(error);
      await expect(controller.remove('2023', '93.42')).rejects.toThrow(error);
    });

    it('should handle multiple delete calls', async () => {
      service.deleteSubjectPlan.mockResolvedValue(true);
      await controller.remove('2023', '93.42');
      await controller.remove('2023', '93.50');
      expect(service.deleteSubjectPlan).toHaveBeenCalledTimes(2);
    });
  });
});

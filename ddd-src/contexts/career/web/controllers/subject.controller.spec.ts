import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectServiceInterface } from '../../domain/interfaces/application/subject.service.interface';
import { SubjectPlanServiceInterface } from '../../domain/interfaces/application/subject-plan.service.interface';
import { CommissionRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';
import { ItbaMappers } from '../../application/mappers/itba.mappers';
import { SUBJECT_SERVICE, SUBJECT_PLAN_SERVICE, COMMISSION_REPOSITORY } from '@boot/di/injection-tokens';
import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';
import { Commission, CommissionTime, SubjectType, DayOfWeek } from '../../domain/entity/commission.model';

describe('SubjectController', () => {
  let controller: SubjectController;
  let subjectService: jest.Mocked<SubjectServiceInterface>;
  let subjectPlanService: jest.Mocked<SubjectPlanServiceInterface>;
  let commissionRepository: jest.Mocked<CommissionRepositoryInterface>;

  const mockSubject = new Subject('93.42', 'Cálculo I', 6);
  
  const mockCommissionTime = new CommissionTime(
    '1',
    DayOfWeek.MONDAY,
    'A-101',
    'A',
    new Date('2025-01-01T09:00:00'),
    new Date('2025-01-01T11:00:00')
  );

  const mockCommission = new Commission(
    '1',
    '93.42',
    'C1',
    new Date('2025-01-01'),
    new Date('2025-06-30'),
    30,
    40,
    SubjectType.SEMESTRAL,
    [mockCommissionTime]
  );

  const mockSubjectPlan = new SubjectPlan(
    '93.42',
    'TEST-2023',
    'A',
    1,
    1,
    [],
    0,
    mockSubject
  );

  beforeEach(async () => {
    const mockSubjectService: jest.Mocked<SubjectServiceInterface> = {
      getSubjectById: jest.fn(),
      getAllSubjects: jest.fn(),
    } as any;

    const mockSubjectPlanService: jest.Mocked<SubjectPlanServiceInterface> = {
      getSubjectsByPlanWithFilters: jest.fn(),
      getSubjectPlan: jest.fn(),
      createSubjectPlan: jest.fn(),
      updateSubjectPlan: jest.fn(),
      deleteSubjectPlan: jest.fn(),
    } as any;

    const mockCommissionRepository: jest.Mocked<CommissionRepositoryInterface> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySubjectCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectController],
      providers: [
        { provide: SUBJECT_SERVICE, useValue: mockSubjectService },
        { provide: SUBJECT_PLAN_SERVICE, useValue: mockSubjectPlanService },
        { provide: COMMISSION_REPOSITORY, useValue: mockCommissionRepository },
      ],
    }).compile();

    controller = module.get<SubjectController>(SubjectController);
    subjectService = module.get(SUBJECT_SERVICE) as jest.Mocked<SubjectServiceInterface>;
    subjectPlanService = module.get(SUBJECT_PLAN_SERVICE) as jest.Mocked<SubjectPlanServiceInterface>;
    commissionRepository = module.get(COMMISSION_REPOSITORY) as jest.Mocked<CommissionRepositoryInterface>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubjectsByPlan', () => {
    it('should throw NotFoundException when plan parameter is missing', async () => {
      await expect(controller.getSubjectsByPlan('')).rejects.toThrow(
        'Plan parameter is required'
      );
    });

    it('should throw NotFoundException when no subjects found for plan', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([]);

      await expect(controller.getSubjectsByPlan('TEST-2023')).rejects.toThrow(
        'No subjects found for the specified plan'
      );
    });

    it('should return organized subjects by section, year, semester', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      expect(result).toBeDefined();
      expect(result['A']).toBeDefined();
      expect(result['A']['1']).toBeDefined();
      expect(result['A']['1']['1']).toBeDefined();
      expect(result['A']['1']['1'].length).toBe(1);
    });

    it('should correctly map subject details in organized structure', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const subjectDetail = result['A']['1']['1'][0];
      expect(subjectDetail.subject_id).toBe('93.42');
      expect(subjectDetail.name).toBe('Cálculo I');
      expect(subjectDetail.credits).toBe(6);
      expect(subjectDetail.section).toBe('A');
    });

    it('should include commissions in subject detail', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const subjectDetail = result['A']['1']['1'][0];
      expect(subjectDetail.commissions).toBeDefined();
      expect(subjectDetail.commissions.length).toBe(1);
      expect(subjectDetail.commissions[0].name).toBe('C1');
    });

    it('should map commission schedule with correct time format', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const schedule = result['A']['1']['1'][0].commissions[0].schedule[0];
      expect(schedule.day).toBe('Monday');
      expect(schedule.classroom).toBe('A-101');
      expect(schedule.building).toBe('A');
      expect(schedule.time_from).toBe('09:00:00');
      expect(schedule.time_to).toBe('11:00:00');
    });

    it('should use course dates from commissions when available', async () => {
      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const subjectDetail = result['A']['1']['1'][0];
      expect(subjectDetail.course_start).toBe('2025-01-01');
      expect(subjectDetail.course_end).toBe('2025-06-30');
    });

    it('should use today date when no commissions available', async () => {
      const subjectPlanNoCommission = new SubjectPlan(
        '93.50',
        'TEST-2023',
        'B',
        2,
        1,
        [],
        0,
        new Subject('93.50', 'Física I', 6)
      );

      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        subjectPlanNoCommission,
      ]);
      commissionRepository.findAll.mockResolvedValue([]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const subjectDetail = result['B']['2']['1'][0];
      expect(subjectDetail.course_start).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(subjectDetail.course_end).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should organize multiple subjects by different sections, years, semesters', async () => {
      const subject2 = new SubjectPlan(
        '93.50',
        'TEST-2023',
        'B',
        2,
        2,
        [],
        0,
        new Subject('93.50', 'Física I', 6)
      );

      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
        subject2,
      ]);
      commissionRepository.findAll.mockResolvedValue([]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      expect(result['A']['1']['1'].length).toBe(1);
      expect(result['B']['2']['2'].length).toBe(1);
    });

    it('should handle subjects with null year and semester (electives)', async () => {
      const electiveSubject = new SubjectPlan(
        '93.60',
        'TEST-2023',
        'A',
        null,
        null,
        [],
        0,
        new Subject('93.60', 'Elective', 3)
      );

      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        electiveSubject,
      ]);
      commissionRepository.findAll.mockResolvedValue([]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      expect(result['A']['0']['0']).toBeDefined();
      expect(result['A']['0']['0'].length).toBe(1);
    });

    it('should filter commissions matching subject code', async () => {
      const otherCommission = new Commission(
        '2',
        '93.50',
        'C1',
        new Date('2025-01-01'),
        new Date('2025-06-30'),
        30,
        40,
        SubjectType.SEMESTRAL
      );

      subjectPlanService.getSubjectsByPlanWithFilters.mockResolvedValue([
        mockSubjectPlan,
      ]);
      commissionRepository.findAll.mockResolvedValue([mockCommission, otherCommission]);

      const result = await controller.getSubjectsByPlan('TEST-2023');

      const subjectDetail = result['A']['1']['1'][0];
      expect(subjectDetail.commissions.length).toBe(1);
      expect(subjectDetail.commissions[0].name).toBe('C1');
    });
  });

  describe('getSubjectById', () => {
    it('should throw NotFoundException when subject not found', async () => {
      subjectService.getSubjectById.mockResolvedValue(null);

      await expect(controller.getSubjectById('NON_EXISTENT')).rejects.toThrow(
        'Subject not found'
      );
    });

    it('should return mapped subject when found', async () => {
      subjectService.getSubjectById.mockResolvedValue(mockSubject);
      const mappedDto = { id: '93.42', name: 'Cálculo I', credits: 6 };
      jest.spyOn(ItbaMappers, 'subjectToDto').mockReturnValue(mappedDto as any);

      const result = await controller.getSubjectById('93.42');

      expect(result).toEqual(mappedDto);
      expect(ItbaMappers.subjectToDto).toHaveBeenCalledWith(mockSubject);
    });

    it('should call service with correct subject id', async () => {
      subjectService.getSubjectById.mockResolvedValue(mockSubject);
      jest.spyOn(ItbaMappers, 'subjectToDto').mockReturnValue({} as any);

      await controller.getSubjectById('93.42');

      expect(subjectService.getSubjectById).toHaveBeenCalledWith('93.42');
      expect(subjectService.getSubjectById).toHaveBeenCalledTimes(1);
    });
  });
});

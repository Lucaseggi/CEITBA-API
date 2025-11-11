import { SubjectPlanRepository } from './subject-plan.repository.impl';
import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';
import { SubjectPlanFilters } from '../../domain/entity/subject-plan-filters';
import {
  SubjectPlanNotFoundException,
  SubjectPlanAlreadyExistsException,
  ForeignKeyConstraintViolationException,
} from '../../domain/exceptions/itba.exceptions';
import { GenericDomainException } from '../../domain/exceptions';
import { createMockPrismaService, MockPrismaService } from 'test/utils/prisma-mock.helper';
import { createTestSubjectPlan, createPrismaSubjectPlanResult, createPrismaSubjectResult } from 'test/utils/test-factories';

describe('SubjectPlanRepositoryImpl', () => {
  let repository: SubjectPlanRepository;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new SubjectPlanRepository(prisma as any);
  });

  describe('find', () => {
    it('should find all subject plans with empty filters', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createPrismaSubjectPlanResult('93.50', '2023', 'CIENCIAS_BASICAS', 1, 2),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
        createPrismaSubjectResult('93.50', 'Probabilidad', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.find(new SubjectPlanFilters());

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SubjectPlan);
    });

    it('should filter by planId', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.find(new SubjectPlanFilters('2023'));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023' },
        orderBy: [{ subjectId: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by planId and section', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      await repository.find(new SubjectPlanFilters('2023', undefined, 'CIENCIAS_BASICAS'));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', section: 'CIENCIAS_BASICAS' },
        orderBy: [{ subjectId: 'asc' }],
      });
    });

    it('should filter by planId and year', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      await repository.find(new SubjectPlanFilters('2023', undefined, undefined, 1));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 1 },
        orderBy: [{ semester: 'asc' }, { subjectId: 'asc' }],
      });
    });

    it('should filter by planId, year, and semester', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      await repository.find(new SubjectPlanFilters('2023', undefined, undefined, 1, 1));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 1, semester: 1 },
        orderBy: [{ subjectId: 'asc' }],
      });
    });

    it('should filter by planId and subjectId', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      await repository.find(new SubjectPlanFilters('2023', '93.42'));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', subjectId: '93.42' },
        orderBy: [{ subjectId: 'asc' }],
      });
    });

    it('should filter electives with electivesOnly flag', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'ELECTIVAS', 0, 0),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Electiva I', 3),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      await repository.find(new SubjectPlanFilters('2023', undefined, undefined, undefined, undefined, true));

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 0, semester: 0 },
        orderBy: [{ subjectId: 'asc' }],
      });
    });

    it('should return empty array when no results found', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.find(new SubjectPlanFilters('2023'));

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all subject plans with subjects', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createPrismaSubjectPlanResult('93.50', '2023', 'CIENCIAS_BASICAS', 1, 2),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
        createPrismaSubjectResult('93.50', 'Probabilidad', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SubjectPlan);
      expect(result[0].subjectId).toBe('93.42');
      expect(result[0].subject.name).toBe('Cálculo I');
    });

    it('should return empty array when no plans exist', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);
      prisma.subject.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByPlanId', () => {
    it('should delegate to find() with planId filter', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findByPlanId('2023');

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023' },
        orderBy: [{ subjectId: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when plan has no subjects', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findByPlanId('2023');

      expect(result).toEqual([]);
    });
  });

  describe('findByPlanAndSubject', () => {
    it('should delegate to find() and return first result', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1)
      ];
      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6)
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findByPlanAndSubject('2023', '93.42');

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: {
          planId: '2023',
          subjectId: '93.42',
        },
        orderBy: [{ subjectId: 'asc' }],
      });
      expect(result).toBeInstanceOf(SubjectPlan);
      expect(result?.planId).toBe('2023');
      expect(result?.subjectId).toBe('93.42');
    });

    it('should return null when plan-subject combination not found', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findByPlanAndSubject('2023', '99.99');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create subject plan', async () => {
      const subjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      const mockCreated = createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);

      prisma.plan.findUnique.mockResolvedValue({ id: '2023' } as any);
      prisma.planSubject.create.mockResolvedValue(mockCreated);
      prisma.subject.findUnique.mockResolvedValue(mockSubject as any);

      const result = await repository.create(subjectPlan);

      expect(prisma.planSubject.create).toHaveBeenCalledWith({
        data: {
          subjectId: '93.42',
          planId: '2023',
          section: 'CIENCIAS_BASICAS',
          year: 1,
          semester: 1,
          dependencies: [],
          creditsRequired: 0,
        },
      });
      expect(result).toBeInstanceOf(SubjectPlan);
    });

    it('should throw SubjectPlanAlreadyExistsException on duplicate (P2002)', async () => {
      const subjectPlan = createTestSubjectPlan();
      const prismaError = { code: 'P2002', meta: {} };

      prisma.plan.findUnique.mockResolvedValue({ id: '2023' } as any);
      prisma.planSubject.create.mockRejectedValue(prismaError);

      await expect(repository.create(subjectPlan)).rejects.toThrow(SubjectPlanAlreadyExistsException);
    });

    it('should throw ForeignKeyConstraintViolationException on invalid FK (P2003)', async () => {
      const subjectPlan = createTestSubjectPlan();
      const prismaError = { code: 'P2003', meta: {} };

      prisma.plan.findUnique.mockResolvedValue({ id: '2023' } as any);
      prisma.planSubject.create.mockRejectedValue(prismaError);

      await expect(repository.create(subjectPlan)).rejects.toThrow(ForeignKeyConstraintViolationException);
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const subjectPlan = createTestSubjectPlan();
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.plan.findUnique.mockResolvedValue({ id: '2023' } as any);
      prisma.planSubject.create.mockRejectedValue(prismaError);

      await expect(repository.create(subjectPlan)).rejects.toThrow('Failed to create subject plan');
    });
  });

  describe('update', () => {
    it('should update subject plan', async () => {
      const subjectPlan = createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 2, 1, ['93.41'], 6);
      const mockUpdated = createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 2, 1, ['93.41'], 6);
      const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);

      prisma.planSubject.update.mockResolvedValue(mockUpdated);
      prisma.subject.findUnique.mockResolvedValue(mockSubject as any);

      const result = await repository.update(subjectPlan);

      expect(prisma.planSubject.update).toHaveBeenCalledWith({
        where: {
          subjectId_planId: {
            subjectId: '93.42',
            planId: '2023',
          },
        },
        data: {
          section: 'CIENCIAS_BASICAS',
          year: 2,
          semester: 1,
          dependencies: ['93.41'],
          creditsRequired: 6,
        },
      });
      expect(result.year).toBe(2);
      expect(result.dependencies).toEqual(['93.41']);
    });

    it('should throw SubjectPlanNotFoundException when not found (P2025)', async () => {
      const subjectPlan = createTestSubjectPlan();
      const prismaError = { code: 'P2025', meta: {} };

      prisma.planSubject.update.mockRejectedValue(prismaError);

      await expect(repository.update(subjectPlan)).rejects.toThrow(SubjectPlanNotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete subject plan', async () => {
      prisma.planSubject.delete.mockResolvedValue({} as any);

      await repository.delete('2023', '93.42');

      expect(prisma.planSubject.delete).toHaveBeenCalledWith({
        where: {
          subjectId_planId: {
            subjectId: '93.42',
            planId: '2023',
          },
        },
      });
    });

    it('should throw SubjectPlanNotFoundException when not found (P2025)', async () => {
      const prismaError = { code: 'P2025', meta: {} };

      prisma.planSubject.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('2023', '99.99')).rejects.toThrow(SubjectPlanNotFoundException);
    });

    it('should throw ForeignKeyConstraintViolationException on FK violation (P2003)', async () => {
      const prismaError = { code: 'P2003', meta: {} };

      prisma.planSubject.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('2023', '93.42')).rejects.toThrow(ForeignKeyConstraintViolationException);
    });
  });
});

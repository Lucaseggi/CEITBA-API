import { SubjectPlanRepositoryImpl } from './subject-plan.repository.impl';
import { SubjectPlan } from '../../domain/entity/subject-plan.model';
import { Subject } from '../../domain/entity/subject.model';
import {
  SubjectPlanNotFoundException,
  SubjectPlanAlreadyExistsException,
  ForeignKeyConstraintViolationException,
} from '../../domain/exceptions/itba.exceptions';
import { GenericDomainException } from '../../domain/exceptions';
import { createMockPrismaService, MockPrismaService } from 'test/utils/prisma-mock.helper';
import { createTestSubjectPlan, createPrismaSubjectPlanResult, createPrismaSubjectResult } from 'test/utils/test-factories';

describe('SubjectPlanRepositoryImpl', () => {
  let repository: SubjectPlanRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new SubjectPlanRepositoryImpl(prisma as any);
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
    it('should return subject plans for given plan', async () => {
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
        orderBy: { subjectId: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when plan has no subjects', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findByPlanId('2023');

      expect(result).toEqual([]);
    });
  });

  describe('findBySubjectId', () => {
    it('should return plans for given subject', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createPrismaSubjectPlanResult('93.42', '2015', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findUnique.mockResolvedValue(mockSubject as any);

      const result = await repository.findBySubjectId('93.42');

      expect(result).toHaveLength(2);
      expect(result[0].planId).toBe('2023');
      expect(result[1].planId).toBe('2015');
    });

    it('should throw error when subject not found', async () => {
      prisma.planSubject.findMany.mockResolvedValue([createPrismaSubjectPlanResult()]);
      prisma.subject.findUnique.mockResolvedValue(null);

      await expect(repository.findBySubjectId('99.99')).rejects.toThrow('Subject with ID 99.99 not found');
    });

    it('should return empty array when subject has no plans', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findBySubjectId('93.42');

      expect(result).toEqual([]);
    });
  });

  describe('findByPlanAndSubject', () => {
    it('should return subject plan when found', async () => {
      const mockPlanSubject = createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1);
      const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);

      prisma.planSubject.findUnique.mockResolvedValue(mockPlanSubject);
      prisma.subject.findUnique.mockResolvedValue(mockSubject as any);

      const result = await repository.findByPlanAndSubject('2023', '93.42');

      expect(prisma.planSubject.findUnique).toHaveBeenCalledWith({
        where: {
          subjectId_planId: {
            subjectId: '93.42',
            planId: '2023',
          },
        },
      });
      expect(result).toBeInstanceOf(SubjectPlan);
      expect(result?.planId).toBe('2023');
      expect(result?.subjectId).toBe('93.42');
    });

    it('should return null when plan-subject combination not found', async () => {
      prisma.planSubject.findUnique.mockResolvedValue(null);

      const result = await repository.findByPlanAndSubject('2023', '99.99');

      expect(result).toBeNull();
    });

    it('should throw error when subject not found', async () => {
      prisma.planSubject.findUnique.mockResolvedValue(createPrismaSubjectPlanResult());
      prisma.subject.findUnique.mockResolvedValue(null);

      await expect(repository.findByPlanAndSubject('2023', '93.42')).rejects.toThrow('Subject with ID 93.42 not found');
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

  describe('findBySection', () => {
    it('should return subject plans for given section', async () => {
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

      const result = await repository.findBySection('2023', 'CIENCIAS_BASICAS');

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', section: 'CIENCIAS_BASICAS' },
        orderBy: { subjectId: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when section has no subjects', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findBySection('2023', 'NONEXISTENT');

      expect(result).toEqual([]);
    });
  });

  describe('findElectives', () => {
    it('should return elective subjects (year=0, semester=0)', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.99', '2023', 'ELECTIVAS', 0, 0),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.99', 'Electiva', 3),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findElectives('2023');

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 0, semester: 0 },
        orderBy: { subjectId: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no electives exist', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findElectives('2023');

      expect(result).toEqual([]);
    });
  });

  describe('findByYear', () => {
    it('should return subject plans for given year', async () => {
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

      const result = await repository.findByYear('2023', 1);

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 1 },
        orderBy: [{ semester: 'asc' }, { subjectId: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when year has no subjects', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findByYear('2023', 5);

      expect(result).toEqual([]);
    });
  });

  describe('findBySemester', () => {
    it('should return subject plans for given year and semester', async () => {
      const mockPlanSubjects = [
        createPrismaSubjectPlanResult('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
      ];

      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
      ];

      prisma.planSubject.findMany.mockResolvedValue(mockPlanSubjects);
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findBySemester('2023', 1, 1);

      expect(prisma.planSubject.findMany).toHaveBeenCalledWith({
        where: { planId: '2023', year: 1, semester: 1 },
        orderBy: { subjectId: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when semester has no subjects', async () => {
      prisma.planSubject.findMany.mockResolvedValue([]);

      const result = await repository.findBySemester('2023', 1, 3);

      expect(result).toEqual([]);
    });
  });
});

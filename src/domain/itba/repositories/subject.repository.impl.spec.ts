import { SubjectRepositoryImpl } from './subject.repository.impl';
import { Subject } from '@/domain/itba/models/subject.model';
import {
  SubjectNotFoundException,
  SubjectAlreadyExistsException,
  ForeignKeyConstraintViolationException,
} from '@/domain/itba/exceptions/itba.exceptions';
import { GenericDomainException } from '@/shared/exceptions';
import { createMockPrismaService, MockPrismaService } from '../../../../test/utils/prisma-mock.helper';
import { createTestSubject, createPrismaSubjectResult } from '../../../../test/utils/test-factories';

describe('SubjectRepositoryImpl', () => {
  let repository: SubjectRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new SubjectRepositoryImpl(prisma as any);
  });

  describe('findAll', () => {
    it('should return all subjects ordered by id', async () => {
      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
        createPrismaSubjectResult('93.50', 'Probabilidad', 6),
      ];

      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findAll();

      expect(prisma.subject.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, credits: true },
        orderBy: { id: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Subject);
      expect(result[0].id).toBe('93.42');
      expect(result[1].id).toBe('93.50');
    });

    it('should return empty array when no subjects exist', async () => {
      prisma.subject.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return subject when found', async () => {
      const mockSubject = createPrismaSubjectResult('93.42', 'Cálculo I', 6);
      prisma.subject.findUnique.mockResolvedValue(mockSubject as any);

      const result = await repository.findById('93.42');

      expect(prisma.subject.findUnique).toHaveBeenCalledWith({
        where: { id: '93.42' },
        select: { id: true, name: true, credits: true },
      });
      expect(result).toBeInstanceOf(Subject);
      expect(result?.id).toBe('93.42');
      expect(result?.name).toBe('Cálculo I');
      expect(result?.credits).toBe(6);
    });

    it('should return null when subject not found', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return subjects matching name with case-insensitive search', async () => {
      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
        createPrismaSubjectResult('93.43', 'Cálculo II', 6),
      ];

      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findByName('Cálculo');

      expect(prisma.subject.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Cálculo',
            mode: 'insensitive',
          },
        },
        select: { id: true, name: true, credits: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches found', async () => {
      prisma.subject.findMany.mockResolvedValue([]);

      const result = await repository.findByName('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and return new subject', async () => {
      const subject = createTestSubject('93.42', 'Cálculo I', 6);
      const mockResult = createPrismaSubjectResult('93.42', 'Cálculo I', 6);

      prisma.subject.create.mockResolvedValue(mockResult as any);

      const result = await repository.create(subject);

      expect(prisma.subject.create).toHaveBeenCalledWith({
        data: {
          id: '93.42',
          name: 'Cálculo I',
          credits: 6,
        },
        select: { id: true, name: true, credits: true },
      });
      expect(result).toBeInstanceOf(Subject);
      expect(result.id).toBe('93.42');
    });

    it('should throw SubjectAlreadyExistsException on duplicate key (P2002)', async () => {
      const subject = createTestSubject('93.42', 'Cálculo I', 6);
      const prismaError = { code: 'P2002', meta: {} };

      prisma.subject.create.mockRejectedValue(prismaError);

      await expect(repository.create(subject)).rejects.toThrow(
        SubjectAlreadyExistsException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const subject = createTestSubject('93.42', 'Cálculo I', 6);
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.subject.create.mockRejectedValue(prismaError);

      await expect(repository.create(subject)).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('update', () => {
    it('should update and return subject', async () => {
      const subject = createTestSubject('93.42', 'Cálculo I Updated', 8);
      const mockResult = createPrismaSubjectResult('93.42', 'Cálculo I Updated', 8);

      prisma.subject.update.mockResolvedValue(mockResult as any);

      const result = await repository.update(subject);

      expect(prisma.subject.update).toHaveBeenCalledWith({
        where: { id: '93.42' },
        data: {
          name: 'Cálculo I Updated',
          credits: 8,
        },
        select: { id: true, name: true, credits: true },
      });
      expect(result).toBeInstanceOf(Subject);
      expect(result.name).toBe('Cálculo I Updated');
      expect(result.credits).toBe(8);
    });

    it('should throw SubjectNotFoundException when subject not found (P2025)', async () => {
      const subject = createTestSubject('non-existent', 'Test', 6);
      const prismaError = { code: 'P2025', meta: {} };

      prisma.subject.update.mockRejectedValue(prismaError);

      await expect(repository.update(subject)).rejects.toThrow(
        SubjectNotFoundException
      );
    });

    it('should throw SubjectAlreadyExistsException on duplicate key (P2002)', async () => {
      const subject = createTestSubject('93.42', 'Duplicate Name', 6);
      const prismaError = { code: 'P2002', meta: {} };

      prisma.subject.update.mockRejectedValue(prismaError);

      await expect(repository.update(subject)).rejects.toThrow(
        SubjectAlreadyExistsException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const subject = createTestSubject('93.42', 'Test', 6);
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.subject.update.mockRejectedValue(prismaError);

      await expect(repository.update(subject)).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('delete', () => {
    it('should delete subject successfully', async () => {
      prisma.subject.delete.mockResolvedValue({} as any);

      await repository.delete('93.42');

      expect(prisma.subject.delete).toHaveBeenCalledWith({
        where: { id: '93.42' },
      });
    });

    it('should throw SubjectNotFoundException when subject not found (P2025)', async () => {
      const prismaError = { code: 'P2025', meta: {} };

      prisma.subject.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('non-existent')).rejects.toThrow(
        SubjectNotFoundException
      );
    });

    it('should throw ForeignKeyConstraintViolationException when subject has related records (P2003)', async () => {
      const prismaError = { code: 'P2003', meta: {} };

      prisma.subject.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('93.42')).rejects.toThrow(
        ForeignKeyConstraintViolationException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.subject.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('93.42')).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('findByIds', () => {
    it('should return subjects with matching ids', async () => {
      const mockSubjects = [
        createPrismaSubjectResult('93.42', 'Cálculo I', 6),
        createPrismaSubjectResult('93.50', 'Probabilidad', 6),
      ];

      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await repository.findByIds(['93.42', '93.50']);

      expect(prisma.subject.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['93.42', '93.50'],
          },
        },
        select: { id: true, name: true, credits: true },
        orderBy: { id: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('93.42');
      expect(result[1].id).toBe('93.50');
    });

    it('should return empty array when ids array is empty', async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(prisma.subject.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when no subjects match the ids', async () => {
      prisma.subject.findMany.mockResolvedValue([]);

      const result = await repository.findByIds(['non-existent-1', 'non-existent-2']);

      expect(result).toEqual([]);
    });
  });
});

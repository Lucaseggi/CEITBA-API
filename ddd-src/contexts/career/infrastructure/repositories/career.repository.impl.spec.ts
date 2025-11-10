import { CareerRepositoryImpl } from './career.repository.impl';
import { Career } from '../../domain/entity/career.model';
import {
  CareerNotFoundException,
  CareerAlreadyExistsException,
  ForeignKeyConstraintViolationException,
} from '../../domain/exceptions/itba.exceptions';
import { GenericDomainException } from '../../domain/exceptions';
import { createMockPrismaService, MockPrismaService } from 'test/utils/prisma-mock.helper';
import { createTestCareer, createPrismaCareerResult } from 'test/utils/test-factories';

describe('CareerRepositoryImpl', () => {
  let repository: CareerRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new CareerRepositoryImpl(prisma as any);
  });

  describe('findAll', () => {
    it('should return all careers ordered by id', async () => {
      const mockCareers = [
        { id: 'I', name: 'Ingeniería Informática' },
        { id: 'E', name: 'Ingeniería Electrónica' },
      ];

      prisma.career.findMany.mockResolvedValue(mockCareers as any);

      const result = await repository.findAll();

      expect(prisma.career.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Career);
      expect(result[0].id).toBe('I');
      expect(result[0].plans).toEqual([]);
    });

    it('should return empty array when no careers exist', async () => {
      prisma.career.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return career when found', async () => {
      const mockCareer = { id: 'I', name: 'Ingeniería Informática' };
      prisma.career.findUnique.mockResolvedValue(mockCareer as any);

      const result = await repository.findById('I');

      expect(prisma.career.findUnique).toHaveBeenCalledWith({
        where: { id: 'I' },
        select: { id: true, name: true },
      });
      expect(result).toBeInstanceOf(Career);
      expect(result?.id).toBe('I');
      expect(result?.name).toBe('Ingeniería Informática');
      expect(result?.plans).toEqual([]);
    });

    it('should return null when career not found', async () => {
      prisma.career.findUnique.mockResolvedValue(null);

      const result = await repository.findById('NON_EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return career when found by name', async () => {
      const mockCareer = { id: 'I', name: 'Ingeniería Informática' };
      prisma.career.findFirst.mockResolvedValue(mockCareer as any);

      const result = await repository.findByName('Ingeniería Informática');

      expect(prisma.career.findFirst).toHaveBeenCalledWith({
        where: { name: 'Ingeniería Informática' },
        select: { id: true, name: true },
      });
      expect(result).toBeInstanceOf(Career);
      expect(result?.id).toBe('I');
    });

    it('should return null when career not found by name', async () => {
      prisma.career.findFirst.mockResolvedValue(null);

      const result = await repository.findByName('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return new career', async () => {
      const career = createTestCareer('I', 'Ingeniería Informática', ['2023']);
      const mockResult = { id: 'I', name: 'Ingeniería Informática' };

      prisma.career.create.mockResolvedValue(mockResult as any);

      const result = await repository.create(career);

      expect(prisma.career.create).toHaveBeenCalledWith({
        data: {
          id: 'I',
          name: 'Ingeniería Informática',
        },
        select: { id: true, name: true },
      });
      expect(result).toBeInstanceOf(Career);
      expect(result.id).toBe('I');
      expect(result.plans).toEqual(['2023']);
    });

    it('should throw CareerAlreadyExistsException on duplicate key (P2002)', async () => {
      const career = createTestCareer('I', 'Ingeniería Informática', []);
      const prismaError = { code: 'P2002', meta: {} };

      prisma.career.create.mockRejectedValue(prismaError);

      await expect(repository.create(career)).rejects.toThrow(
        CareerAlreadyExistsException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const career = createTestCareer('I', 'Ingeniería Informática', []);
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.career.create.mockRejectedValue(prismaError);

      await expect(repository.create(career)).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('update', () => {
    it('should update and return career', async () => {
      const career = createTestCareer('I', 'Ingeniería Informática Updated', ['2023']);
      const mockResult = { id: 'I', name: 'Ingeniería Informática Updated' };

      prisma.career.update.mockResolvedValue(mockResult as any);

      const result = await repository.update(career);

      expect(prisma.career.update).toHaveBeenCalledWith({
        where: { id: 'I' },
        data: {
          name: 'Ingeniería Informática Updated',
        },
        select: { id: true, name: true },
      });
      expect(result).toBeInstanceOf(Career);
      expect(result.name).toBe('Ingeniería Informática Updated');
      expect(result.plans).toEqual(['2023']);
    });

    it('should throw CareerNotFoundException when career not found (P2025)', async () => {
      const career = createTestCareer('NON_EXISTENT', 'Test', []);
      const prismaError = { code: 'P2025', meta: {} };

      prisma.career.update.mockRejectedValue(prismaError);

      await expect(repository.update(career)).rejects.toThrow(
        CareerNotFoundException
      );
    });

    it('should throw CareerAlreadyExistsException on duplicate key (P2002)', async () => {
      const career = createTestCareer('I', 'Duplicate Name', []);
      const prismaError = { code: 'P2002', meta: {} };

      prisma.career.update.mockRejectedValue(prismaError);

      await expect(repository.update(career)).rejects.toThrow(
        CareerAlreadyExistsException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const career = createTestCareer('I', 'Test', []);
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.career.update.mockRejectedValue(prismaError);

      await expect(repository.update(career)).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('delete', () => {
    it('should delete career successfully', async () => {
      prisma.career.delete.mockResolvedValue({} as any);

      await repository.delete('I');

      expect(prisma.career.delete).toHaveBeenCalledWith({
        where: { id: 'I' },
      });
    });

    it('should throw CareerNotFoundException when career not found (P2025)', async () => {
      const prismaError = { code: 'P2025', meta: {} };

      prisma.career.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('NON_EXISTENT')).rejects.toThrow(
        CareerNotFoundException
      );
    });

    it('should throw ForeignKeyConstraintViolationException when career has related records (P2003)', async () => {
      const prismaError = { code: 'P2003', meta: {} };

      prisma.career.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('I')).rejects.toThrow(
        ForeignKeyConstraintViolationException
      );
    });

    it('should throw GenericDomainException on unknown error', async () => {
      const prismaError = { code: 'P9999', message: 'Unknown error' };

      prisma.career.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('I')).rejects.toThrow(
        GenericDomainException
      );
    });
  });

  describe('findCareersWithPlans', () => {
    it('should return careers with their plans as a record', async () => {
      const mockCareers = [
        {
          id: 'I',
          name: 'Ingeniería Informática',
          plans: [{ id: '2023' }, { id: '2015' }],
        },
        {
          id: 'E',
          name: 'Ingeniería Electrónica',
          plans: [{ id: '2020' }],
        },
      ];

      prisma.career.findMany.mockResolvedValue(mockCareers as any);

      const result = await repository.findCareersWithPlans();

      expect(prisma.career.findMany).toHaveBeenCalledWith({
        include: { plans: { select: { id: true } } },
        orderBy: { id: 'asc' },
      });

      expect(Object.keys(result)).toEqual(['I', 'E']);
      expect(result['I']).toBeInstanceOf(Career);
      expect(result['I'].plans).toEqual(['2023', '2015']);
      expect(result['E'].plans).toEqual(['2020']);
    });

    it('should return empty object when no careers exist', async () => {
      prisma.career.findMany.mockResolvedValue([]);

      const result = await repository.findCareersWithPlans();

      expect(result).toEqual({});
    });

    it('should handle careers with no plans', async () => {
      const mockCareers = [
        {
          id: 'I',
          name: 'Ingeniería Informática',
          plans: [],
        },
      ];

      prisma.career.findMany.mockResolvedValue(mockCareers as any);

      const result = await repository.findCareersWithPlans();

      expect(result['I'].plans).toEqual([]);
    });
  });
});

import { CommissionRepositoryImpl } from './commission.repository.impl';
import { GenericDomainException } from '../../domain/exceptions';
import { createMockPrismaService, MockPrismaService } from 'test/utils/prisma-mock.helper';
import { createTestCommission, createTestCommissionTime, createPrismaCommissionResult } from 'test/utils/test-factories';
import { Commission, DayOfWeek, SubjectType } from '../../domain/entity/commission.model';

describe('CommissionRepositoryImpl', () => {
  let repository: CommissionRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new CommissionRepositoryImpl(prisma as any);
  });

  describe('findAll', () => {
    it('should return all commissions ordered by subjectCode', async () => {
      const mockCommissions = [
        createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []),
        createPrismaCommissionResult('COMM-002', '93.50', 'B', new Date('2024-03-01'), new Date('2024-07-31'), 25, 35, 'SEMESTRAL', []),
      ];

      prisma.commission.findMany.mockResolvedValue(mockCommissions as any);

      const result = await repository.findAll();

      expect(prisma.commission.findMany).toHaveBeenCalledWith({
        include: { times: true },
        orderBy: { subjectCode: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Commission);
      expect(result[0].id).toBe('COMM-001');
    });

    it('should return empty array when no commissions exist', async () => {
      prisma.commission.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return commission when found', async () => {
      const mockCommission = createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []);

      prisma.commission.findUnique.mockResolvedValue(mockCommission as any);

      const result = await repository.findById('COMM-001');

      expect(prisma.commission.findUnique).toHaveBeenCalledWith({
        where: { id: 'COMM-001' },
        include: { times: true },
      });
      expect(result).toBeInstanceOf(Commission);
      expect(result?.id).toBe('COMM-001');
    });

    it('should return null when commission not found', async () => {
      prisma.commission.findUnique.mockResolvedValue(null);

      const result = await repository.findById('NON_EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findBySubjectCode', () => {
    it('should return commissions for given subject code', async () => {
      const mockCommissions = [
        createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []),
        createPrismaCommissionResult('COMM-002', '93.42', 'B', new Date('2024-03-01'), new Date('2024-07-31'), 25, 35, 'SEMESTRAL', []),
      ];

      prisma.commission.findMany.mockResolvedValue(mockCommissions as any);

      const result = await repository.findBySubjectCode('93.42');

      expect(prisma.commission.findMany).toHaveBeenCalledWith({
        where: { subjectCode: '93.42' },
        include: { times: true },
        orderBy: { commissionName: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no commissions found', async () => {
      prisma.commission.findMany.mockResolvedValue([]);

      const result = await repository.findBySubjectCode('99.99');

      expect(result).toEqual([]);
    });
  });

  describe('findActiveCommissions', () => {
    it('should return commissions active on current date', async () => {
      const today = new Date();
      const mockCommissions = [
        createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-12-31'), 30, 40, 'SEMESTRAL', []),
      ];

      prisma.commission.findMany.mockResolvedValue(mockCommissions as any);

      const result = await repository.findActiveCommissions();

      expect(prisma.commission.findMany).toHaveBeenCalledWith({
        where: {
          courseStart: { lte: expect.any(Date) },
          courseEnd: { gte: expect.any(Date) },
        },
        include: { times: true },
        orderBy: { subjectCode: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByCommissionName', () => {
    it('should return commissions with given name', async () => {
      const mockCommissions = [
        createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []),
      ];

      prisma.commission.findMany.mockResolvedValue(mockCommissions as any);

      const result = await repository.findByCommissionName('A');

      expect(prisma.commission.findMany).toHaveBeenCalledWith({
        where: { commissionName: 'A' },
        include: { times: true },
        orderBy: { subjectCode: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create commission with times', async () => {
      const time = createTestCommissionTime('COMM-001', DayOfWeek.MONDAY, 'A-101', 'Aula');
      const commission = createTestCommission('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, SubjectType.SEMESTRAL, [time]);

      const mockCreated = createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', [{
        courseId: 'COMM-001',
        day: DayOfWeek.MONDAY,
        classroom: 'A-101',
        building: 'Aula',
        hourFrom: time.hourFrom,
        hourTo: time.hourTo,
      }]);

      prisma.commission.create.mockResolvedValue(mockCreated as any);

      const result = await repository.create(commission);

      expect(prisma.commission.create).toHaveBeenCalledWith({
        data: {
          id: 'COMM-001',
          subjectCode: '93.42',
          commissionName: 'A',
          courseStart: commission.courseStart,
          courseEnd: commission.courseEnd,
          enrolledStudents: 30,
          quota: 40,
          subjectType: SubjectType.SEMESTRAL,
          times: {
            create: [{
              day: DayOfWeek.MONDAY,
              classroom: 'A-101',
              building: 'Aula',
              hourFrom: time.hourFrom,
              hourTo: time.hourTo,
            }],
          },
        },
        include: { times: true },
      });
      expect(result).toBeInstanceOf(Commission);
      expect(result.id).toBe('COMM-001');
    });

    it('should throw GenericDomainException on error', async () => {
      const commission = createTestCommission();
      const error = new Error('Database error');

      prisma.commission.create.mockRejectedValue(error);

      await expect(repository.create(commission)).rejects.toThrow(GenericDomainException);
    });
  });

  describe('update', () => {
    it('should update commission and replace times', async () => {
      const time = createTestCommissionTime('COMM-001', DayOfWeek.TUESDAY, 'A-102', 'Aula');
      const commission = createTestCommission('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 35, 40, SubjectType.SEMESTRAL, [time]);

      const mockUpdated = createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 35, 40, 'SEMESTRAL', [{
        courseId: 'COMM-001',
        day: DayOfWeek.TUESDAY,
        classroom: 'A-102',
        building: 'Aula',
        hourFrom: time.hourFrom,
        hourTo: time.hourTo,
      }]);

      prisma.commission.update.mockResolvedValue(mockUpdated as any);

      const result = await repository.update(commission);

      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: 'COMM-001' },
        data: {
          subjectCode: '93.42',
          commissionName: 'A',
          courseStart: commission.courseStart,
          courseEnd: commission.courseEnd,
          enrolledStudents: 35,
          quota: 40,
          subjectType: SubjectType.SEMESTRAL,
          times: {
            deleteMany: {},
            create: [{
              day: DayOfWeek.TUESDAY,
              classroom: 'A-102',
              building: 'Aula',
              hourFrom: time.hourFrom,
              hourTo: time.hourTo,
            }],
          },
        },
        include: { times: true },
      });
      expect(result.enrolledStudents).toBe(35);
    });

    it('should throw GenericDomainException on error', async () => {
      const commission = createTestCommission();
      const error = new Error('Update failed');

      prisma.commission.update.mockRejectedValue(error);

      await expect(repository.update(commission)).rejects.toThrow(GenericDomainException);
    });
  });

  describe('delete', () => {
    it('should delete commission successfully', async () => {
      prisma.commission.delete.mockResolvedValue({} as any);

      await repository.delete('COMM-001');

      expect(prisma.commission.delete).toHaveBeenCalledWith({
        where: { id: 'COMM-001' },
      });
    });

    it('should throw GenericDomainException on error', async () => {
      const error = new Error('Delete failed');

      prisma.commission.delete.mockRejectedValue(error);

      await expect(repository.delete('COMM-001')).rejects.toThrow(GenericDomainException);
    });
  });

  describe('upsert', () => {
    it('should upsert commission (create if not exists)', async () => {
      const commission = createTestCommission('COMM-001', '93.42', 'A');
      const mockUpserted = createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []);

      prisma.commission.upsert.mockResolvedValue(mockUpserted as any);

      const result = await repository.upsert(commission);

      expect(prisma.commission.upsert).toHaveBeenCalledWith({
        where: { id: 'COMM-001' },
        update: expect.objectContaining({
          subjectCode: '93.42',
          commissionName: 'A',
        }),
        create: expect.objectContaining({
          id: 'COMM-001',
          subjectCode: '93.42',
          commissionName: 'A',
        }),
        include: { times: true },
      });
      expect(result).toBeInstanceOf(Commission);
    });

    it('should throw GenericDomainException on error', async () => {
      const commission = createTestCommission();
      const error = new Error('Upsert failed');

      prisma.commission.upsert.mockRejectedValue(error);

      await expect(repository.upsert(commission)).rejects.toThrow(GenericDomainException);
    });
  });

  describe('upsertMany', () => {
    it('should upsert multiple commissions sequentially', async () => {
      const commissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.50', 'B'),
      ];

      const mockResults = [
        createPrismaCommissionResult('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-07-31'), 30, 40, 'SEMESTRAL', []),
        createPrismaCommissionResult('COMM-002', '93.50', 'B', new Date('2024-03-01'), new Date('2024-07-31'), 25, 35, 'SEMESTRAL', []),
      ];

      prisma.commission.upsert
        .mockResolvedValueOnce(mockResults[0] as any)
        .mockResolvedValueOnce(mockResults[1] as any);

      const result = await repository.upsertMany(commissions);

      expect(prisma.commission.upsert).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('COMM-001');
      expect(result[1].id).toBe('COMM-002');
    });

    it('should return empty array for empty input', async () => {
      const result = await repository.upsertMany([]);

      expect(result).toEqual([]);
      expect(prisma.commission.upsert).not.toHaveBeenCalled();
    });
  });
});

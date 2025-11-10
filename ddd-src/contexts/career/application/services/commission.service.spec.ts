import { Test, TestingModule } from '@nestjs/testing';
import { CommissionServiceImpl } from './commission.service';
import { CommissionRepositoryInterface } from '../../domain/interfaces/infrastructure/repositories/commission.repository.interface';
import { COMMISSION_REPOSITORY } from '@/shared/constants/injection-tokens';
import { createTestCommission } from 'test/utils/test-factories';

describe('CommissionServiceImpl', () => {
  let service: CommissionServiceImpl;
  let repository: jest.Mocked<CommissionRepositoryInterface>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CommissionRepositoryInterface> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySubjectCode: jest.fn(),
      findActiveCommissions: jest.fn(),
      findByCommissionName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      upsertMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionServiceImpl,
        {
          provide: COMMISSION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CommissionServiceImpl>(CommissionServiceImpl);
    repository = module.get(COMMISSION_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCommissions', () => {
    it('should return all commissions from repository', async () => {
      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.50', 'B'),
      ];

      repository.findAll.mockResolvedValue(mockCommissions);

      const result = await service.getAllCommissions();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCommissions);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no commissions exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getAllCommissions();

      expect(result).toEqual([]);
    });
  });

  describe('getCommissionById', () => {
    it('should return commission when found', async () => {
      const mockCommission = createTestCommission('COMM-001', '93.42', 'A');
      repository.findById.mockResolvedValue(mockCommission);

      const result = await service.getCommissionById('COMM-001');

      expect(repository.findById).toHaveBeenCalledWith('COMM-001');
      expect(result).toEqual(mockCommission);
    });

    it('should return null when commission not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.getCommissionById('NON_EXISTENT');

      expect(repository.findById).toHaveBeenCalledWith('NON_EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getCommissionsBySubject', () => {
    it('should return commissions for given subject code', async () => {
      const mockCommissions = [
        createTestCommission('COMM-001', '93.42', 'A'),
        createTestCommission('COMM-002', '93.42', 'B'),
      ];

      repository.findBySubjectCode.mockResolvedValue(mockCommissions);

      const result = await service.getCommissionsBySubject('93.42');

      expect(repository.findBySubjectCode).toHaveBeenCalledWith('93.42');
      expect(result).toEqual(mockCommissions);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when subject has no commissions', async () => {
      repository.findBySubjectCode.mockResolvedValue([]);

      const result = await service.getCommissionsBySubject('99.99');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveCommissions', () => {
    it('should return active commissions', async () => {
      const mockActiveCommissions = [
        createTestCommission('COMM-001', '93.42', 'A', new Date('2024-03-01'), new Date('2024-12-31')),
      ];

      repository.findActiveCommissions.mockResolvedValue(mockActiveCommissions);

      const result = await service.getActiveCommissions();

      expect(repository.findActiveCommissions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockActiveCommissions);
    });

    it('should return empty array when no active commissions exist', async () => {
      repository.findActiveCommissions.mockResolvedValue([]);

      const result = await service.getActiveCommissions();

      expect(result).toEqual([]);
    });
  });

  describe('createCommission', () => {
    it('should create and return new commission', async () => {
      const commission = createTestCommission('COMM-001', '93.42', 'A');
      repository.create.mockResolvedValue(commission);

      const result = await service.createCommission(commission);

      expect(repository.create).toHaveBeenCalledWith(commission);
      expect(result).toEqual(commission);
    });
  });

  describe('updateCommission', () => {
    it('should update and return commission', async () => {
      const commission = createTestCommission('COMM-001', '93.42', 'A');
      repository.update.mockResolvedValue(commission);

      const result = await service.updateCommission(commission);

      expect(repository.update).toHaveBeenCalledWith(commission);
      expect(result).toEqual(commission);
    });
  });

  describe('deleteCommission', () => {
    it('should delete commission', async () => {
      repository.delete.mockResolvedValue(undefined);

      await service.deleteCommission('COMM-001');

      expect(repository.delete).toHaveBeenCalledWith('COMM-001');
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Delete failed');
      repository.delete.mockRejectedValue(error);

      await expect(service.deleteCommission('COMM-001')).rejects.toThrow('Delete failed');
    });
  });
});

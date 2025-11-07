import { Test, TestingModule } from '@nestjs/testing';
import { SubjectService } from './subject.service';
import { SubjectRepository } from '@/domain/itba/interfaces/repositories/subject.repository.interface';
import { Subject } from '@/domain/itba/models/subject.model';
import { SUBJECT_REPOSITORY } from '@/shared/constants/injection-tokens';
import { createTestSubject } from '../../../../test/utils/test-factories';

describe('SubjectService', () => {
  let service: SubjectService;
  let repository: jest.Mocked<SubjectRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<SubjectRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        {
          provide: SUBJECT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
    repository = module.get(SUBJECT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSubjects', () => {
    it('should return all subjects from repository', async () => {
      const mockSubjects = [
        createTestSubject('93.42', 'Cálculo I', 6),
        createTestSubject('93.50', 'Probabilidad', 6),
      ];

      repository.findAll.mockResolvedValue(mockSubjects);

      const result = await service.getAllSubjects();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSubjects);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no subjects exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getAllSubjects();

      expect(result).toEqual([]);
    });
  });

  describe('getSubjectById', () => {
    it('should return subject when found', async () => {
      const mockSubject = createTestSubject('93.42', 'Cálculo I', 6);
      repository.findById.mockResolvedValue(mockSubject);

      const result = await service.getSubjectById('93.42');

      expect(repository.findById).toHaveBeenCalledWith('93.42');
      expect(result).toEqual(mockSubject);
    });

    it('should return null when subject not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.getSubjectById('non-existent');

      expect(repository.findById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getSubjectsByName', () => {
    it('should return subjects matching the name', async () => {
      const mockSubjects = [
        createTestSubject('93.42', 'Cálculo I', 6),
        createTestSubject('93.43', 'Cálculo II', 6),
      ];

      repository.findByName.mockResolvedValue(mockSubjects);

      const result = await service.getSubjectsByName('Cálculo');

      expect(repository.findByName).toHaveBeenCalledWith('Cálculo');
      expect(result).toEqual(mockSubjects);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches found', async () => {
      repository.findByName.mockResolvedValue([]);

      const result = await service.getSubjectsByName('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('createSubject', () => {
    it('should create and return new subject', async () => {
      const createDto = {
        id: '93.42',
        name: 'Cálculo I',
        credits: 6,
      };

      const expectedSubject = createTestSubject('93.42', 'Cálculo I', 6);
      repository.create.mockResolvedValue(expectedSubject);

      const result = await service.createSubject(createDto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '93.42',
          name: 'Cálculo I',
          credits: 6,
        })
      );
      expect(result).toEqual(expectedSubject);
    });

    it('should pass domain model to repository', async () => {
      const createDto = {
        id: '93.50',
        name: 'Probabilidad',
        credits: 8,
      };

      const mockSubject = createTestSubject('93.50', 'Probabilidad', 8);
      repository.create.mockResolvedValue(mockSubject);

      await service.createSubject(createDto);

      const calledArg = repository.create.mock.calls[0][0];
      expect(calledArg).toBeInstanceOf(Subject);
      expect(calledArg.id).toBe('93.50');
      expect(calledArg.name).toBe('Probabilidad');
      expect(calledArg.credits).toBe(8);
    });
  });

  describe('updateSubject', () => {
    it('should update and return subject when it exists', async () => {
      const existingSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const updatedSubject = createTestSubject('93.42', 'Cálculo I Updated', 8);

      repository.findById.mockResolvedValue(existingSubject);
      repository.update.mockResolvedValue(updatedSubject);

      const result = await service.updateSubject('93.42', {
        name: 'Cálculo I Updated',
        credits: 8,
      });

      expect(repository.findById).toHaveBeenCalledWith('93.42');
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedSubject);
    });

    it('should return null when subject does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.updateSubject('non-existent', {
        name: 'Test',
      });

      expect(repository.findById).toHaveBeenCalledWith('non-existent');
      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should update only name when credits not provided', async () => {
      const existingSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const updatedSubject = createTestSubject('93.42', 'Cálculo I Updated', 6);

      repository.findById.mockResolvedValue(existingSubject);
      repository.update.mockResolvedValue(updatedSubject);

      await service.updateSubject('93.42', { name: 'Cálculo I Updated' });

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '93.42',
          name: 'Cálculo I Updated',
          credits: 6, // Should preserve original credits
        })
      );
    });

    it('should update only credits when name not provided', async () => {
      const existingSubject = createTestSubject('93.42', 'Cálculo I', 6);
      const updatedSubject = createTestSubject('93.42', 'Cálculo I', 8);

      repository.findById.mockResolvedValue(existingSubject);
      repository.update.mockResolvedValue(updatedSubject);

      await service.updateSubject('93.42', { credits: 8 });

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '93.42',
          name: 'Cálculo I', // Should preserve original name
          credits: 8,
        })
      );
    });
  });

  describe('deleteSubject', () => {
    it('should delete subject and return true when it exists', async () => {
      const existingSubject = createTestSubject('93.42', 'Cálculo I', 6);
      repository.findById.mockResolvedValue(existingSubject);
      repository.delete.mockResolvedValue(undefined);

      const result = await service.deleteSubject('93.42');

      expect(repository.findById).toHaveBeenCalledWith('93.42');
      expect(repository.delete).toHaveBeenCalledWith('93.42');
      expect(result).toBe(true);
    });

    it('should return false when subject does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.deleteSubject('non-existent');

      expect(repository.findById).toHaveBeenCalledWith('non-existent');
      expect(repository.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('getSubjectsByIds', () => {
    it('should return subjects with matching ids', async () => {
      const mockSubjects = [
        createTestSubject('93.42', 'Cálculo I', 6),
        createTestSubject('93.50', 'Probabilidad', 6),
      ];

      repository.findByIds.mockResolvedValue(mockSubjects);

      const result = await service.getSubjectsByIds(['93.42', '93.50']);

      expect(repository.findByIds).toHaveBeenCalledWith(['93.42', '93.50']);
      expect(result).toEqual(mockSubjects);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty ids list', async () => {
      repository.findByIds.mockResolvedValue([]);

      const result = await service.getSubjectsByIds([]);

      expect(repository.findByIds).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when no subjects match', async () => {
      repository.findByIds.mockResolvedValue([]);

      const result = await service.getSubjectsByIds(['non-existent-1', 'non-existent-2']);

      expect(result).toEqual([]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ClassroomService } from './classroom.service';
import { ClassroomRepository } from '../../domain/interfaces/infrastructure/repositories/classroom.repository.interface';
import { ClassroomSchedule, DayOfWeek } from '../../domain/entity/classroom.model';
import { CLASSROOM_REPOSITORY } from '@boot/di/injection-tokens';
import { createTestClassroom, createTestClassroomSchedule, createTestTimeSlot } from 'test/utils/test-factories';

describe('ClassroomService', () => {
  let service: ClassroomService;
  let repository: jest.Mocked<ClassroomRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ClassroomRepository> = {
      findAllClassrooms: jest.fn(),
      findOccupiedClassrooms: jest.fn(),
      findByBuilding: jest.fn(),
      findByDay: jest.fn(),
      findAvailableClassrooms: jest.fn(),
      findConflicts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomService,
        {
          provide: CLASSROOM_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClassroomService>(ClassroomService);
    repository = module.get(CLASSROOM_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllClassrooms', () => {
    it('should return all classrooms from repository', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula')),
        createTestClassroomSchedule(createTestClassroom('A-102', 'Aula')),
      ];

      repository.findAllClassrooms.mockResolvedValue(mockClassrooms);

      const result = await service.getAllClassrooms();

      expect(repository.findAllClassrooms).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClassrooms);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no classrooms exist', async () => {
      repository.findAllClassrooms.mockResolvedValue([]);

      const result = await service.getAllClassrooms();

      expect(result).toEqual([]);
    });
  });

  describe('getClassroomsWithFilters', () => {
    it('should return occupied classrooms when status is occupied', async () => {
      const mockOccupiedClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), DayOfWeek.MONDAY),
      ];

      repository.findOccupiedClassrooms.mockResolvedValue(mockOccupiedClassrooms);

      const result = await service.getClassroomsWithFilters({ status: 'occupied' });

      expect(repository.findOccupiedClassrooms).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockOccupiedClassrooms);
    });

    it('should return occupied classrooms for current semester when specified', async () => {
      const mockOccupiedClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), DayOfWeek.MONDAY),
      ];

      repository.findOccupiedClassrooms.mockResolvedValue(mockOccupiedClassrooms);

      const result = await service.getClassroomsWithFilters({
        status: 'occupied',
        current_semester: true
      });

      expect(repository.findOccupiedClassrooms).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockOccupiedClassrooms);
    });

    it('should return available classrooms when status is available', async () => {
      const mockAvailableClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), null, null),
      ];

      repository.findAvailableClassrooms.mockResolvedValue(mockAvailableClassrooms);

      const result = await service.getClassroomsWithFilters({ status: 'available' });

      expect(repository.findAvailableClassrooms).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAvailableClassrooms);
    });

    it('should return all classrooms when no status filter provided', async () => {
      const mockAllClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula')),
      ];

      repository.findAllClassrooms.mockResolvedValue(mockAllClassrooms);

      const result = await service.getClassroomsWithFilters({});

      expect(repository.findAllClassrooms).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAllClassrooms);
    });
  });

  describe('getOccupiedClassrooms', () => {
    it('should return occupied classrooms', async () => {
      const mockOccupiedClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), DayOfWeek.MONDAY),
      ];

      repository.findOccupiedClassrooms.mockResolvedValue(mockOccupiedClassrooms);

      const result = await service.getOccupiedClassrooms();

      expect(repository.findOccupiedClassrooms).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockOccupiedClassrooms);
    });

    it('should pass current semester flag to repository', async () => {
      repository.findOccupiedClassrooms.mockResolvedValue([]);

      await service.getOccupiedClassrooms(true);

      expect(repository.findOccupiedClassrooms).toHaveBeenCalledWith(true);
    });
  });

  describe('getClassroomsByBuilding', () => {
    it('should return classrooms filtered by building', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula')),
        createTestClassroomSchedule(createTestClassroom('A-102', 'Aula')),
      ];

      repository.findByBuilding.mockResolvedValue(mockClassrooms);

      const result = await service.getClassroomsByBuilding('Aula');

      expect(repository.findByBuilding).toHaveBeenCalledWith('Aula');
      expect(result).toEqual(mockClassrooms);
    });

    it('should return empty array when building has no classrooms', async () => {
      repository.findByBuilding.mockResolvedValue([]);

      const result = await service.getClassroomsByBuilding('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getClassroomsByDay', () => {
    it('should return classrooms filtered by day', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), DayOfWeek.MONDAY),
      ];

      repository.findByDay.mockResolvedValue(mockClassrooms);

      const result = await service.getClassroomsByDay('Monday');

      expect(repository.findByDay).toHaveBeenCalledWith('Monday');
      expect(result).toEqual(mockClassrooms);
    });

    it('should return empty array when no classrooms on that day', async () => {
      repository.findByDay.mockResolvedValue([]);

      const result = await service.getClassroomsByDay('Sunday');

      expect(result).toEqual([]);
    });
  });

  describe('getAvailableClassrooms', () => {
    it('should return available classrooms', async () => {
      const mockAvailableClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), null, null),
        createTestClassroomSchedule(createTestClassroom('A-102', 'Aula'), null, null),
      ];

      repository.findAvailableClassrooms.mockResolvedValue(mockAvailableClassrooms);

      const result = await service.getAvailableClassrooms();

      expect(repository.findAvailableClassrooms).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAvailableClassrooms);
    });
  });

  describe('checkForConflicts', () => {
    it('should check for conflicts with given schedule', async () => {
      const mockConflicts = [
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('09:00', '11:00')
        ),
      ];

      repository.findConflicts.mockResolvedValue(mockConflicts);

      const result = await service.checkForConflicts(
        'A-101',
        'Aula',
        'Monday',
        '08:00',
        '10:00'
      );

      expect(repository.findConflicts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConflicts);
    });

    it('should return empty array when no conflicts exist', async () => {
      repository.findConflicts.mockResolvedValue([]);

      const result = await service.checkForConflicts(
        'A-101',
        'Aula',
        'Monday',
        '08:00',
        '10:00'
      );

      expect(result).toEqual([]);
    });

    it('should throw error for invalid time format', async () => {
      await expect(
        service.checkForConflicts('A-101', 'Aula', 'Monday', 'invalid', '10:00')
      ).rejects.toThrow('Invalid schedule data');
    });

    it('should throw error for invalid day', async () => {
      await expect(
        service.checkForConflicts('A-101', 'Aula', 'InvalidDay', '08:00', '10:00')
      ).rejects.toThrow('Invalid schedule data');
    });

    it('should throw error when time range is invalid (start >= end)', async () => {
      await expect(
        service.checkForConflicts('A-101', 'Aula', 'Monday', '10:00', '08:00')
      ).rejects.toThrow('Invalid schedule data');
    });
  });
});

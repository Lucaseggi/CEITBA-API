import { ClassroomController } from './classroom.controller';
import { ItbaMappers } from '../../infrastructure/mappers/itba.mappers';
import { createTestClassroom, createTestClassroomSchedule, createTestTimeSlot } from 'test/utils/test-factories';
import { DayOfWeek } from '../../domain/entity/classroom.model';
import { ClassroomServiceInterface } from '../../domain/interfaces/application/classroom.service.interface';
import { ClassroomConflictDto, ClassroomQueryDto } from '../dtos/classroom.dto';

describe('ClassroomController', () => {
  let controller: ClassroomController;
  let service: jest.Mocked<ClassroomServiceInterface>;

  beforeEach(() => {
    service = {
      getClassroomsWithFilters: jest.fn(),
      getClassroomsByBuilding: jest.fn(),
      getClassroomsByDay: jest.fn(),
      checkForConflicts: jest.fn(),
    } as unknown as jest.Mocked<ClassroomServiceInterface>;

    controller = new ClassroomController(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getClassrooms', () => {
    it('should return grouped classrooms by day and building when status is occupied', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('09:00', '11:00')
        ),
        createTestClassroomSchedule(
          createTestClassroom('A-102', 'Aula'),
          DayOfWeek.TUESDAY,
          createTestTimeSlot('10:00', '12:00')
        ),
      ];

      service.getClassroomsWithFilters.mockResolvedValue(mockClassrooms);

      const query: ClassroomQueryDto = { status: 'occupied' };
      const result = await controller.getClassrooms(query);

      expect(service.getClassroomsWithFilters).toHaveBeenCalledWith({
        status: 'occupied',
        current_semester: undefined,
      });
      expect(result).toEqual(ItbaMappers.groupClassroomsByDayAndBuilding(mockClassrooms));
    });

    it('should return grouped classrooms by building when status is available', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula'), null, null),
        createTestClassroomSchedule(createTestClassroom('A-102', 'Aula'), null, null),
      ];

      service.getClassroomsWithFilters.mockResolvedValue(mockClassrooms);

      const query: ClassroomQueryDto = { status: 'available' };
      const result = await controller.getClassrooms(query);

      expect(service.getClassroomsWithFilters).toHaveBeenCalledWith({
        status: 'available',
        current_semester: undefined,
      });
      expect(result).toEqual(ItbaMappers.groupClassroomsByBuilding(mockClassrooms));
    });

    it('should return grouped classrooms by building when no status provided', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula')),
      ];

      service.getClassroomsWithFilters.mockResolvedValue(mockClassrooms);

      const query: ClassroomQueryDto = {};
      const result = await controller.getClassrooms(query);

      expect(service.getClassroomsWithFilters).toHaveBeenCalledWith({
        status: undefined,
        current_semester: undefined,
      });
      expect(result).toEqual(ItbaMappers.groupClassroomsByBuilding(mockClassrooms));
    });

    it('should pass current_semester filter to service', async () => {
      service.getClassroomsWithFilters.mockResolvedValue([]);

      const query: ClassroomQueryDto = { status: 'occupied', current_semester: true };
      await controller.getClassrooms(query);

      expect(service.getClassroomsWithFilters).toHaveBeenCalledWith({
        status: 'occupied',
        current_semester: true,
      });
    });

    it('should return empty object when no classrooms exist', async () => {
      service.getClassroomsWithFilters.mockResolvedValue([]);

      const query: ClassroomQueryDto = {};
      const result = await controller.getClassrooms(query);

      expect(result).toEqual({});
    });
  });

  describe('getClassroomsByBuilding', () => {
    it('should return classrooms for given building', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(createTestClassroom('A-101', 'Aula')),
        createTestClassroomSchedule(createTestClassroom('A-102', 'Aula')),
      ];

      service.getClassroomsByBuilding.mockResolvedValue(mockClassrooms);

      const result = await controller.getClassroomsByBuilding('Aula');

      expect(service.getClassroomsByBuilding).toHaveBeenCalledWith('Aula');
      expect(result).toEqual(ItbaMappers.classroomSchedulesToDto(mockClassrooms));
    });

    it('should return empty array when building has no classrooms', async () => {
      service.getClassroomsByBuilding.mockResolvedValue([]);

      const result = await controller.getClassroomsByBuilding('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getClassroomsByDay', () => {
    it('should return classrooms for given day', async () => {
      const mockClassrooms = [
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('09:00', '11:00')
        ),
      ];

      service.getClassroomsByDay.mockResolvedValue(mockClassrooms);

      const result = await controller.getClassroomsByDay('Monday');

      expect(service.getClassroomsByDay).toHaveBeenCalledWith('Monday');
      expect(result).toEqual(ItbaMappers.classroomSchedulesToScheduleDto(mockClassrooms));
    });

    it('should return empty array when no classrooms on that day', async () => {
      service.getClassroomsByDay.mockResolvedValue([]);

      const result = await controller.getClassroomsByDay('Sunday');

      expect(result).toEqual([]);
    });
  });

  describe('checkConflicts', () => {
    it('should check for conflicts and return mapped results', async () => {
      const conflictRequest: ClassroomConflictDto = {
        classroom: 'A-101',
        building: 'Aula',
        day: 'Monday',
        hourFrom: '08:00',
        hourTo: '10:00',
      };

      const mockConflicts = [
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('09:00', '11:00')
        ),
      ];

      service.checkForConflicts.mockResolvedValue(mockConflicts);

      const result = await controller.checkConflicts(conflictRequest);

      expect(service.checkForConflicts).toHaveBeenCalledWith(
        'A-101',
        'Aula',
        'Monday',
        '08:00',
        '10:00'
      );
      expect(result).toEqual(ItbaMappers.classroomSchedulesToScheduleDto(mockConflicts));
    });

    it('should return empty array when no conflicts found', async () => {
      const conflictRequest: ClassroomConflictDto = {
        classroom: 'A-101',
        building: 'Aula',
        day: 'Monday',
        hourFrom: '08:00',
        hourTo: '10:00',
      };

      service.checkForConflicts.mockResolvedValue([]);

      const result = await controller.checkConflicts(conflictRequest);

      expect(result).toEqual([]);
    });

    it('should handle conflicts with multiple overlapping time slots', async () => {
      const conflictRequest: ClassroomConflictDto = {
        classroom: 'A-101',
        building: 'Aula',
        day: 'Monday',
        hourFrom: '08:00',
        hourTo: '18:00',
      };

      const mockConflicts = [
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('09:00', '11:00')
        ),
        createTestClassroomSchedule(
          createTestClassroom('A-101', 'Aula'),
          DayOfWeek.MONDAY,
          createTestTimeSlot('14:00', '16:00')
        ),
      ];

      service.checkForConflicts.mockResolvedValue(mockConflicts);

      const result = await controller.checkConflicts(conflictRequest);

      expect(result).toHaveLength(2);
      expect(result).toEqual(ItbaMappers.classroomSchedulesToScheduleDto(mockConflicts));
    });
  });
});

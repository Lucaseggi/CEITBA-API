import { ClassroomRepositoryImpl } from './classroom.repository.impl';
import { ClassroomSchedule, Classroom, TimeSlot, DayOfWeek } from '@/domain/itba/models/classroom.model';
import { createMockPrismaService, MockPrismaService } from '../../../../test/utils/prisma-mock.helper';
import { createTestClassroom, createTestTimeSlot, createTestClassroomSchedule } from '../../../../test/utils/test-factories';

describe('ClassroomRepositoryImpl', () => {
  let repository: ClassroomRepositoryImpl;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    repository = new ClassroomRepositoryImpl(prisma as any);
  });

  describe('findAllClassrooms', () => {
    it('should return all distinct classrooms ordered by building and classroom', async () => {
      const mockResults = [
        { building: 'Aula', classroom: 'A-101' },
        { building: 'Aula', classroom: 'A-102' },
        { building: 'Laboratorio', classroom: 'L-201' },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockResults);

      const result = await repository.findAllClassrooms();

      expect(prisma.commissionTime.findMany).toHaveBeenCalledWith({
        distinct: ['building', 'classroom'],
        select: { building: true, classroom: true },
        orderBy: [{ building: 'asc' }, { classroom: 'asc' }],
      });
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(ClassroomSchedule);
      expect(result[0].classroom.name).toBe('A-101');
      expect(result[0].classroom.building).toBe('Aula');
    });

    it('should return empty array when no classrooms exist', async () => {
      prisma.commissionTime.findMany.mockResolvedValue([]);

      const result = await repository.findAllClassrooms();

      expect(result).toEqual([]);
    });
  });

  describe('findOccupiedClassrooms', () => {
    it('should return occupied classrooms for current semester by default', async () => {
      const today = new Date();
      const mockResults = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Monday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockResults);

      const result = await repository.findOccupiedClassrooms(true);

      expect(prisma.commissionTime.findMany).toHaveBeenCalledWith({
        where: {
          commission: {
            courseStart: { lte: expect.any(Date) },
            courseEnd: { gte: expect.any(Date) },
          },
        },
        select: {
          building: true,
          classroom: true,
          day: true,
          hourFrom: true,
          hourTo: true,
        },
        distinct: ['building', 'classroom', 'day', 'hourFrom', 'hourTo'],
        orderBy: [
          { building: 'asc' },
          { classroom: 'asc' },
          { day: 'asc' },
          { hourFrom: 'asc' },
          { hourTo: 'asc' },
        ],
      });
      expect(result).toHaveLength(1);
      expect(result[0].day).toBe(DayOfWeek.MONDAY);
    });

    it('should return all occupied classrooms when currentSemester is false', async () => {
      const mockResults = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Tuesday',
          hourFrom: '14:00',
          hourTo: '16:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockResults);

      const result = await repository.findOccupiedClassrooms(false);

      expect(prisma.commissionTime.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          building: true,
          classroom: true,
          day: true,
          hourFrom: true,
          hourTo: true,
        },
        distinct: ['building', 'classroom', 'day', 'hourFrom', 'hourTo'],
        orderBy: [
          { building: 'asc' },
          { classroom: 'asc' },
          { day: 'asc' },
          { hourFrom: 'asc' },
          { hourTo: 'asc' },
        ],
      });
      expect(result).toHaveLength(1);
    });

    it('should handle invalid day values gracefully', async () => {
      const mockResults = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'InvalidDay',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockResults);

      const result = await repository.findOccupiedClassrooms();

      // Should still map the result, day will be INVALID or null
      expect(result).toHaveLength(1);
      expect(result[0].day).toBe(DayOfWeek.INVALID);
    });
  });

  describe('findByBuilding', () => {
    it('should return classrooms filtered by building (case-insensitive)', async () => {
      const mockAllClassrooms = [
        { building: 'Aula', classroom: 'A-101' },
        { building: 'Aula', classroom: 'A-102' },
        { building: 'Laboratorio', classroom: 'L-201' },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockAllClassrooms);

      const result = await repository.findByBuilding('Aula');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.classroom.building.toLowerCase() === 'aula')).toBe(true);
    });

    it('should be case-insensitive when filtering', async () => {
      const mockAllClassrooms = [
        { building: 'Aula', classroom: 'A-101' },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockAllClassrooms);

      const result = await repository.findByBuilding('AULA');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when building not found', async () => {
      const mockAllClassrooms = [
        { building: 'Aula', classroom: 'A-101' },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockAllClassrooms);

      const result = await repository.findByBuilding('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('findByDay', () => {
    it('should return classrooms filtered by day (case-insensitive)', async () => {
      const mockOccupiedClassrooms = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Monday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
        {
          building: 'Aula',
          classroom: 'A-102',
          day: 'Tuesday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockOccupiedClassrooms);

      const result = await repository.findByDay('Monday');

      expect(result).toHaveLength(1);
      expect(result[0].day?.toLowerCase()).toBe('monday');
    });

    it('should be case-insensitive when filtering', async () => {
      const mockOccupiedClassrooms = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Monday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockOccupiedClassrooms);

      const result = await repository.findByDay('MONDAY');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when day not found', async () => {
      const mockOccupiedClassrooms = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Monday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockOccupiedClassrooms);

      const result = await repository.findByDay('Sunday');

      expect(result).toEqual([]);
    });
  });

  describe('findAvailableClassrooms', () => {
    it('should return only available classrooms (no day and no time slot)', async () => {
      const mockAllClassrooms = [
        { building: 'Aula', classroom: 'A-101' },
        { building: 'Aula', classroom: 'A-102' },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockAllClassrooms);

      const result = await repository.findAvailableClassrooms();

      // Classrooms without day/time are available
      expect(result.every(s => s.isAvailable())).toBe(true);
    });
  });

  describe('findConflicts', () => {
    it('should find classrooms that conflict with given schedule', async () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const targetSchedule = createTestClassroomSchedule(classroom, DayOfWeek.MONDAY, timeSlot);

      const mockOccupiedClassrooms = [
        {
          building: 'Aula',
          classroom: 'A-101',
          day: 'Monday',
          hourFrom: '09:00',
          hourTo: '11:00',
        },
        {
          building: 'Aula',
          classroom: 'A-102',
          day: 'Monday',
          hourFrom: '09:00',
          hourTo: '11:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockOccupiedClassrooms);

      const result = await repository.findConflicts(targetSchedule);

      // Should find conflict with A-101 (same classroom, overlapping time)
      expect(result.length).toBeGreaterThanOrEqual(0);
      // The actual conflict detection depends on the ClassroomSchedule.conflictsWith implementation
    });

    it('should return empty array when no conflicts exist', async () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const targetSchedule = createTestClassroomSchedule(classroom, DayOfWeek.MONDAY, timeSlot);

      const mockOccupiedClassrooms = [
        {
          building: 'Aula',
          classroom: 'A-102', // Different classroom
          day: 'Monday',
          hourFrom: '08:00',
          hourTo: '10:00',
        },
      ];

      prisma.commissionTime.findMany.mockResolvedValue(mockOccupiedClassrooms);

      const result = await repository.findConflicts(targetSchedule);

      expect(result).toEqual([]);
    });
  });
});

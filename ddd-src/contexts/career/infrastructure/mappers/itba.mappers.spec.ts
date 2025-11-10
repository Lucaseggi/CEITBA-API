import { DayOfWeek } from '../persistence/types/day-of-week.types';
import { ItbaMappers } from './itba.mappers';
import {
  createTestSubject,
  createTestCareer,
  createTestSubjectPlan,
  createTestClassroom,
  createTestClassroomSchedule,
  createTestTimeSlot,
} from 'test/utils/test-factories';

describe('ItbaMappers', () => {
  describe('careerToDto', () => {
    it('should map career to DTO', () => {
      const career = createTestCareer('I', 'Ingeniería Informática', ['2015', '2023']);

      const result = ItbaMappers.careerToDto(career);

      expect(result).toEqual({
        id: 'I',
        name: 'Ingeniería Informática',
        plans: ['2015', '2023'],
      });
    });

    it('should create a copy of plans array', () => {
      const career = createTestCareer('I', 'Ingeniería Informática', ['2015']);

      const result = ItbaMappers.careerToDto(career);

      expect(result.plans).not.toBe(career.plans);
      expect(result.plans).toEqual(career.plans);
    });
  });

  describe('careersToDto', () => {
    it('should map multiple careers to DTOs', () => {
      const careers = [
        createTestCareer('I', 'Ingeniería Informática', ['2015', '2023']),
        createTestCareer('E', 'Ingeniería Electrónica', ['2010']),
      ];

      const result = ItbaMappers.careersToDto(careers);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('I');
      expect(result[1].id).toBe('E');
    });

    it('should return empty array for empty input', () => {
      const result = ItbaMappers.careersToDto([]);

      expect(result).toEqual([]);
    });
  });

  describe('careerMapToDto', () => {
    it('should map career record to DTO record', () => {
      const careerMap = {
        I: createTestCareer('I', 'Ingeniería Informática', ['2015']),
        E: createTestCareer('E', 'Ingeniería Electrónica', ['2010']),
      };

      const result = ItbaMappers.careerMapToDto(careerMap);

      expect(result.I).toEqual({
        id: 'I',
        name: 'Ingeniería Informática',
        plans: ['2015'],
      });
      expect(result.E).toEqual({
        id: 'E',
        name: 'Ingeniería Electrónica',
        plans: ['2010'],
      });
    });

    it('should return empty object for empty input', () => {
      const result = ItbaMappers.careerMapToDto({});

      expect(result).toEqual({});
    });
  });

  describe('subjectToDto', () => {
    it('should map subject to DTO', () => {
      const subject = createTestSubject('93.42', 'Cálculo I', 6);

      const result = ItbaMappers.subjectToDto(subject);

      expect(result).toEqual({
        id: '93.42',
        name: 'Cálculo I',
        credits: 6,
      });
    });
  });

  describe('subjectsToDto', () => {
    it('should map multiple subjects to DTOs', () => {
      const subjects = [
        createTestSubject('93.42', 'Cálculo I', 6),
        createTestSubject('93.50', 'Probabilidad', 6),
      ];

      const result = ItbaMappers.subjectsToDto(subjects);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('93.42');
      expect(result[1].id).toBe('93.50');
    });

    it('should return empty array for empty input', () => {
      const result = ItbaMappers.subjectsToDto([]);

      expect(result).toEqual([]);
    });
  });

  describe('subjectPlanToDto', () => {
    it('should map subject plan to DTO with nested subject', () => {
      const subject = createTestSubject('93.42', 'Cálculo I', 6);
      const subjectPlan = createTestSubjectPlan(
        '93.42',
        '2023',
        'CIENCIAS_BASICAS',
        1,
        1,
        [],
        0,
        subject
      );

      const result = ItbaMappers.subjectPlanToDto(subjectPlan);

      expect(result).toEqual({
        subjectId: '93.42',
        planId: '2023',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 1,
        dependencies: [],
        creditsRequired: 0,
        subject: {
          id: '93.42',
          name: 'Cálculo I',
          credits: 6,
        },
      });
    });

    it('should create a copy of dependencies array', () => {
      const subjectPlan = createTestSubjectPlan(
        '93.43',
        '2023',
        'CIENCIAS_BASICAS',
        2,
        1,
        ['93.42'],
        6
      );

      const result = ItbaMappers.subjectPlanToDto(subjectPlan);

      expect(result.dependencies).not.toBe(subjectPlan.dependencies);
      expect(result.dependencies).toEqual(['93.42']);
    });
  });

  describe('subjectPlansToDto', () => {
    it('should map multiple subject plans to DTOs', () => {
      const plans = [
        createTestSubjectPlan('93.42', '2023', 'CIENCIAS_BASICAS', 1, 1),
        createTestSubjectPlan('93.43', '2023', 'CIENCIAS_BASICAS', 1, 2),
      ];

      const result = ItbaMappers.subjectPlansToDto(plans);

      expect(result).toHaveLength(2);
      expect(result[0].subjectId).toBe('93.42');
      expect(result[1].subjectId).toBe('93.43');
    });
  });

  describe('classroomScheduleToDto', () => {
    it('should map classroom schedule to DTO with time slot', () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedule = createTestClassroomSchedule(classroom, DayOfWeek.MONDAY, timeSlot);

      const result = ItbaMappers.classroomScheduleToDto(schedule);

      expect(result).toEqual({
        name: 'A-101',
        building: 'Aula',
        day: DayOfWeek.MONDAY,
        hourFrom: '08:00',
        hourTo: '10:00',
      });
    });

    it('should map classroom schedule to DTO with null time slot', () => {
      const classroom = createTestClassroom('A-102', 'Aula');
      const schedule = createTestClassroomSchedule(classroom, DayOfWeek.TUESDAY, null);

      const result = ItbaMappers.classroomScheduleToDto(schedule);

      expect(result).toEqual({
        name: 'A-102',
        building: 'Aula',
        day: DayOfWeek.TUESDAY,
        hourFrom: null,
        hourTo: null,
      });
    });
  });

  describe('classroomScheduleToScheduleDto', () => {
    it('should map to schedule DTO format', () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const timeSlot = createTestTimeSlot('14:00', '16:00');
      const schedule = createTestClassroomSchedule(classroom, DayOfWeek.WEDNESDAY, timeSlot);

      const result = ItbaMappers.classroomScheduleToScheduleDto(schedule);

      expect(result).toEqual({
        classroom: 'A-101',
        building: 'Aula',
        day: DayOfWeek.WEDNESDAY,
        hourFrom: '14:00',
        hourTo: '16:00',
      });
    });
  });

  describe('groupClassroomsByBuilding', () => {
    it('should group classrooms by building', () => {
      const classroom1 = createTestClassroom('A-101', 'Aula');
      const classroom2 = createTestClassroom('A-102', 'Aula');
      const classroom3 = createTestClassroom('L-201', 'Laboratorio');

      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedules = [
        createTestClassroomSchedule(classroom1, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(classroom2, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(classroom3, DayOfWeek.TUESDAY, timeSlot),
      ];

      const result = ItbaMappers.groupClassroomsByBuilding(schedules);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['Aula']).toHaveLength(2);
      expect(result['Laboratorio']).toHaveLength(1);
    });

    it('should skip online classrooms', () => {
      const onlineClassroom = createTestClassroom('ZOOM-01', 'Online');
      const physicalClassroom = createTestClassroom('A-101', 'Aula');

      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedules = [
        createTestClassroomSchedule(onlineClassroom, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(physicalClassroom, DayOfWeek.MONDAY, timeSlot),
      ];

      const result = ItbaMappers.groupClassroomsByBuilding(schedules);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['Aula']).toBeDefined();
      expect(result['Online']).toBeUndefined();
    });

    it('should return empty object for empty input', () => {
      const result = ItbaMappers.groupClassroomsByBuilding([]);

      expect(result).toEqual({});
    });
  });

  describe('groupClassroomsByDayAndBuilding', () => {
    it('should group classrooms by day and building', () => {
      const classroom1 = createTestClassroom('A-101', 'Aula');
      const classroom2 = createTestClassroom('L-201', 'Laboratorio');

      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedules = [
        createTestClassroomSchedule(classroom1, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(classroom2, DayOfWeek.MONDAY, timeSlot),
      ];

      const result = ItbaMappers.groupClassroomsByDayAndBuilding(schedules);

      expect(result[DayOfWeek.MONDAY]).toBeDefined();
      expect(result[DayOfWeek.MONDAY]['Aula']).toHaveLength(1);
      expect(result[DayOfWeek.MONDAY]['Laboratorio']).toHaveLength(1);
    });

    it('should skip schedules without day', () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedules = [
        createTestClassroomSchedule(classroom, null, timeSlot),
      ];

      const result = ItbaMappers.groupClassroomsByDayAndBuilding(schedules);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should skip unoccupied schedules (no day and no time slot)', () => {
      const classroom = createTestClassroom('A-101', 'Aula');
      const schedules = [
        createTestClassroomSchedule(classroom, null, null),
      ];

      const result = ItbaMappers.groupClassroomsByDayAndBuilding(schedules);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should skip online classrooms', () => {
      const onlineClassroom = createTestClassroom('ZOOM-01', 'Online');
      const timeSlot = createTestTimeSlot('08:00', '10:00');
      const schedules = [
        createTestClassroomSchedule(onlineClassroom, DayOfWeek.MONDAY, timeSlot),
      ];

      const result = ItbaMappers.groupClassroomsByDayAndBuilding(schedules);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('classroomSchedulesToDto', () => {
    it('should map multiple schedules to DTOs', () => {
      const classroom1 = createTestClassroom('A-101', 'Aula');
      const classroom2 = createTestClassroom('A-102', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');

      const schedules = [
        createTestClassroomSchedule(classroom1, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(classroom2, DayOfWeek.TUESDAY, timeSlot),
      ];

      const result = ItbaMappers.classroomSchedulesToDto(schedules);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('A-101');
      expect(result[1].name).toBe('A-102');
    });
  });

  describe('classroomSchedulesToScheduleDto', () => {
    it('should map multiple schedules to schedule DTOs', () => {
      const classroom1 = createTestClassroom('A-101', 'Aula');
      const classroom2 = createTestClassroom('A-102', 'Aula');
      const timeSlot = createTestTimeSlot('08:00', '10:00');

      const schedules = [
        createTestClassroomSchedule(classroom1, DayOfWeek.MONDAY, timeSlot),
        createTestClassroomSchedule(classroom2, DayOfWeek.TUESDAY, timeSlot),
      ];

      const result = ItbaMappers.classroomSchedulesToScheduleDto(schedules);

      expect(result).toHaveLength(2);
      expect(result[0].classroom).toBe('A-101');
      expect(result[1].classroom).toBe('A-102');
    });
  });
});

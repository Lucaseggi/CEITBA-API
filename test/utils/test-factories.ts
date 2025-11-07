import { Subject } from '@/domain/itba/models/subject.model';
import { Career } from '@/domain/itba/models/career.model';
import { Classroom, ClassroomSchedule, DayOfWeek, TimeSlot } from '@/domain/itba/models/classroom.model';
import { SubjectPlan } from '@/domain/itba/models/subject-plan.model';

/**
 * Factory functions for creating test domain models
 */

export const createTestSubject = (
  id = '93.42',
  name = 'Cálculo I',
  credits = 61
): Subject => {
  return new Subject(id, name, credits);
};

export const createTestCareer = (
  id = 'I',
  name = 'Ingeniería Informática',
  plans: string[] = ['2015', '2023']
): Career => {
  return new Career(id, name, plans);
};

export const createTestClassroom = (
  name = 'A-101',
  building = 'Aula'
): Classroom => {
  return new Classroom(name, building);
};

export const createTestTimeSlot = (
  hourFrom = '08:00',
  hourTo = '10:00'
): TimeSlot => {
  return new TimeSlot(hourFrom, hourTo);
};

export const createTestSubjectPlan = (
  subjectId = '93.42',
  planId = '2023',
  section = 'CIENCIAS_BASICAS',
  year = 1,
  semester = 1,
  dependencies: string[] = [],
  creditsRequired = 0,
  subject?: Subject
): SubjectPlan => {
  const testSubject = subject || createTestSubject(subjectId);
  return new SubjectPlan(
    subjectId,
    planId,
    section,
    year,
    semester,
    dependencies,
    creditsRequired,
    testSubject
  );
};

export const createTestClassroomSchedule = (
  classroom?: Classroom,
  day: DayOfWeek | null = DayOfWeek.MONDAY,
  timeSlot: TimeSlot | null = null
): ClassroomSchedule => {
  const testClassroom = classroom || createTestClassroom();
  const testTimeSlot = timeSlot !== undefined ? timeSlot : createTestTimeSlot();
  return new ClassroomSchedule(
    testClassroom,
    day,
    testTimeSlot
  );
};

/**
 * Prisma result mock builders
 * These create objects that look like Prisma query results
 */

export const createPrismaSubjectResult = (
  id = '93.42',
  name = 'Cálculo I',
  credits = 6
) => ({
  id,
  name,
  credits,
});

export const createPrismaCareerResult = (
  id = 'I',
  name = 'Ingeniería Informática',
  plans: string[] = ['2015', '2023']
) => ({
  id,
  name,
  plans,
});

export const createPrismaClassroomResult = (
  name = 'A-101',
  building = 'Aula'
) => ({
  name,
  building,
});

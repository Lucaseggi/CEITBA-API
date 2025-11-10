import { DayOfWeek } from '@/shared/types/day-of-week.types';
import { Career } from 'ddd-src/contexts/career/domain/entity/career.model';
import { Classroom, ClassroomSchedule, TimeSlot } from 'ddd-src/contexts/career/domain/entity/classroom.model';
import { Commission, CommissionTime, SubjectType } from 'ddd-src/contexts/career/domain/entity/commission.model';
import { SubjectPlan } from 'ddd-src/contexts/career/domain/entity/subject-plan.model';
import { Subject } from 'ddd-src/contexts/career/domain/entity/subject.model';

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

export const createTestCommissionTime = (
  courseId = 'COMM-001',
  day: DayOfWeek = DayOfWeek.MONDAY,
  classroom = 'A-101',
  building = 'Aula',
  hourFrom: Date = new Date('2024-01-01T08:00:00'),
  hourTo: Date = new Date('2024-01-01T10:00:00')
): CommissionTime => {
  return new CommissionTime(courseId, day, classroom, building, hourFrom, hourTo);
};

export const createTestCommission = (
  id = 'COMM-001',
  subjectCode = '93.42',
  commissionName = 'A',
  courseStart: Date = new Date('2024-03-01'),
  courseEnd: Date = new Date('2024-07-31'),
  enrolledStudents = 30,
  quota = 40,
  subjectType: SubjectType = SubjectType.SEMESTRAL,
  times: CommissionTime[] = []
): Commission => {
  return new Commission(
    id,
    subjectCode,
    commissionName,
    courseStart,
    courseEnd,
    enrolledStudents,
    quota,
    subjectType,
    times
  );
};

export const createPrismaCommissionResult = (
  id = 'COMM-001',
  subjectCode = '93.42',
  commissionName = 'A',
  courseStart: Date = new Date('2024-03-01'),
  courseEnd: Date = new Date('2024-07-31'),
  enrolledStudents = 30,
  quota = 40,
  subjectType = 'SEMESTRAL',
  times: any[] = []
) => ({
  id,
  subjectCode,
  commissionName,
  courseStart,
  courseEnd,
  enrolledStudents,
  quota,
  subjectType,
  times,
});

export const createPrismaSubjectPlanResult = (
  subjectId = '93.42',
  planId = '2023',
  section = 'CIENCIAS_BASICAS',
  year = 1,
  semester = 1,
  dependencies: string[] = [],
  creditsRequired = 0
) => ({
  subjectId,
  planId,
  section,
  year,
  semester,
  dependencies,
  creditsRequired,
});


/**
 * Mock ITBA API response helpers for testing data sync functionality
 */

import { DayOfWeek } from "@career/domain/entity/day-of-week.types";
import { Commission, CommissionTime, SubjectType } from "ddd-src/contexts/career/domain/entity/commission.model";
import { SubjectPlan } from "ddd-src/contexts/career/domain/entity/subject-plan.model";
import { Subject } from "ddd-src/contexts/career/domain/entity/subject.model";

/**
 * Create mock subject data that would come from ITBA API
 */
export function createMockApiSubject(
  id: string = '93.42',
  name: string = 'Algoritmos y Estructuras de Datos',
  credits: number = 6
): Subject {
  return new Subject(id, name, credits);
}

/**
 * Create mock subject plan data that would come from ITBA API
 */
export function createMockApiSubjectPlan(
  subjectId: string = '93.42',
  planId: string = '2023',
  section: string = 'CIENCIAS_BASICAS',
  year: number | null = 1,
  semester: number | null = 1,
  dependencies: string[] = [],
  creditsRequired: number | null = 0
): SubjectPlan {
  const subject = createMockApiSubject(subjectId);

  return new SubjectPlan(
    subjectId,
    planId,
    section,
    year,
    semester,
    dependencies,
    creditsRequired,
    subject
  );
}

/**
 * Create mock commission time data
 */
export function createMockApiCommissionTime(
  courseId: string = 'COMM-001',
  day: DayOfWeek = DayOfWeek.MONDAY,
  classroom: string = 'A-101',
  building: string = 'Aula',
  hourFrom: Date = new Date('2024-01-01T08:00:00'),
  hourTo: Date = new Date('2024-01-01T10:00:00')
): CommissionTime {
  return new CommissionTime(courseId, day, classroom, building, hourFrom, hourTo);
}

/**
 * Create mock commission data that would come from ITBA API
 */
export function createMockApiCommission(
  id: string = 'COMM-001',
  subjectCode: string = '93.42',
  commissionName: string = 'A',
  courseStart: Date = new Date('2024-03-01'),
  courseEnd: Date = new Date('2024-07-15'),
  enrolledStudents: number = 25,
  quota: number = 30,
  subjectType: SubjectType = SubjectType.SEMESTRAL,
  times: CommissionTime[] = []
): Commission {
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
}

/**
 * Mock ITBA API service responses
 * Can be used to override the real ITBA API service in tests
 */
export class MockItbaApiService {
  private mockSubjectsByPlan: Map<string, SubjectPlan[]> = new Map();
  private mockCommissions: Commission[] = [];
  private mockCommissionsBySubject: Map<string, Commission[]> = new Map();

  /**
   * Set mock response for getSubjectsByPlan
   */
  setMockSubjectsByPlan(planId: string, subjects: SubjectPlan[]): void {
    this.mockSubjectsByPlan.set(planId, subjects);
  }

  /**
   * Set mock response for getCommissions
   */
  setMockCommissions(commissions: Commission[]): void {
    this.mockCommissions = commissions;
  }

  /**
   * Set mock response for getCommissionsBySubject
   */
  setMockCommissionsBySubject(subjectCode: string, commissions: Commission[]): void {
    this.mockCommissionsBySubject.set(subjectCode, commissions);
  }

  /**
   * Mock implementation of getSubjectsByPlan
   */
  async getSubjectsByPlan(planId: string): Promise<SubjectPlan[]> {
    const subjects = this.mockSubjectsByPlan.get(planId);
    if (!subjects) {
      return [];
    }
    return subjects;
  }

  /**
   * Mock implementation of getCommissions
   */
  async getCommissions(params?: any): Promise<Commission[]> {
    return this.mockCommissions;
  }

  /**
   * Mock implementation of getCommissionsBySubject
   */
  async getCommissionsBySubject(subjectCode: string, params?: any): Promise<Commission[]> {
    const commissions = this.mockCommissionsBySubject.get(subjectCode);
    if (!commissions) {
      return [];
    }
    return commissions;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.mockSubjectsByPlan.clear();
    this.mockCommissions = [];
    this.mockCommissionsBySubject.clear();
  }
}

/**
 * Create a mock ITBA API service instance
 */
export function createMockItbaApiService(): MockItbaApiService {
  return new MockItbaApiService();
}

/**
 * Create fixture data for a typical plan with subjects
 */
export function createPlanWithSubjectsFixture(planId: string = '2023'): SubjectPlan[] {
  return [
    createMockApiSubjectPlan('93.40', planId, 'CIENCIAS_BASICAS', 1, 1, [], 0),
    createMockApiSubjectPlan('93.41', planId, 'CIENCIAS_BASICAS', 1, 1, [], 0),
    createMockApiSubjectPlan('93.42', planId, 'CIENCIAS_BASICAS', 1, 2, ['93.41'], 0),
    createMockApiSubjectPlan('93.50', planId, 'ESPECIALIZACION', 2, 1, ['93.42'], 20),
  ];
}

/**
 * Create fixture data for commissions
 */
export function createCommissionsFixture(subjectCode: string = '93.42'): Commission[] {
  const timeA = createMockApiCommissionTime('COMM-A', DayOfWeek.MONDAY, 'A-101', 'Aula');
  const timeB = createMockApiCommissionTime('COMM-B', DayOfWeek.TUESDAY, 'A-102', 'Aula');

  return [
    createMockApiCommission('COMM-A', subjectCode, 'A', new Date('2024-03-01'), new Date('2024-07-15'), 25, 30, SubjectType.SEMESTRAL, [timeA]),
    createMockApiCommission('COMM-B', subjectCode, 'B', new Date('2024-03-01'), new Date('2024-07-15'), 28, 30, SubjectType.SEMESTRAL, [timeB]),
  ];
}

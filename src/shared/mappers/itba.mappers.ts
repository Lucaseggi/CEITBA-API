
import { CareerDto } from "ddd-src/contexts/career/application/dtos/career.dto";
import { ClassroomDto, ClassroomsByBuildingDto, ClassroomsByDayAndBuildingDto, ClassroomScheduleDto } from "ddd-src/contexts/career/application/dtos/classroom.dto";
import { SubjectDto } from "ddd-src/contexts/career/application/dtos/subject.dto";
import { SubjectPlanDto } from "ddd-src/contexts/career/application/dtos/subjectPlan.dto";
import { Career } from "ddd-src/contexts/career/domain/entity/career.model";
import { ClassroomSchedule } from "ddd-src/contexts/career/domain/entity/classroom.model";
import { SubjectPlan } from "ddd-src/contexts/career/domain/entity/subject-plan.model";
import { Subject } from "ddd-src/contexts/career/domain/entity/subject.model";

export class ItbaMappers {
  static careerToDto(career: Career): CareerDto {
    return {
      id: career.id,
      name: career.name,
      plans: [...career.plans],
    };
  }

  static careersToDto(careers: Career[]): CareerDto[] {
    return careers.map(this.careerToDto);
  }

  static careerMapToDto(
    careerMap: Record<string, Career>,
  ): Record<string, CareerDto> {
    const result: Record<string, CareerDto> = {};
    for (const [key, career] of Object.entries(careerMap)) {
      result[key] = this.careerToDto(career);
    }
    return result;
  }

  static subjectToDto(subject: Subject): SubjectDto {
    return {
      id: subject.id,
      name: subject.name,
      credits: subject.credits,
    };
  }

  static subjectsToDto(subjects: Subject[]): SubjectDto[] {
    return subjects.map(this.subjectToDto);
  }

  static subjectPlanToDto(subjectPlan: SubjectPlan): SubjectPlanDto {
    return {
      subjectId: subjectPlan.subjectId,
      planId: subjectPlan.planId,
      section: subjectPlan.section,
      year: subjectPlan.year,
      semester: subjectPlan.semester,
      dependencies: [...subjectPlan.dependencies],
      creditsRequired: subjectPlan.creditsRequired,
      subject: {
        id: subjectPlan.subject.id,
        name: subjectPlan.subject.name,
        credits: subjectPlan.subject.credits,
      },
    };
  }

  static subjectPlansToDto(subjectPlans: SubjectPlan[]): SubjectPlanDto[] {
    return subjectPlans.map(this.subjectPlanToDto);
  }

  static classroomScheduleToDto(schedule: ClassroomSchedule): ClassroomDto {
    return {
      name: schedule.classroom.name,
      building: schedule.classroom.building,
      day: schedule.day,
      hourFrom: schedule.timeSlot?.hourFrom ?? null,
      hourTo: schedule.timeSlot?.hourTo ?? null,
    };
  }

  static classroomScheduleToScheduleDto(
    schedule: ClassroomSchedule,
  ): ClassroomScheduleDto {
    return {
      classroom: schedule.classroom.name,
      building: schedule.classroom.building,
      day: schedule.day,
      hourFrom: schedule.timeSlot?.hourFrom ?? null,
      hourTo: schedule.timeSlot?.hourTo ?? null,
    };
  }

  static groupClassroomsByBuilding(
    classrooms: ClassroomSchedule[],
  ): ClassroomsByBuildingDto {
    const result: ClassroomsByBuildingDto = {};

    for (const schedule of classrooms) {
      const building = schedule.classroom.building;

      // Skip online classrooms
      if (schedule.classroom.isOnline()) {
        continue;
      }

      if (!result[building]) {
        result[building] = [];
      }

      result[building].push(this.classroomScheduleToDto(schedule));
    }

    return result;
  }

  static groupClassroomsByDayAndBuilding(
    classrooms: ClassroomSchedule[],
  ): ClassroomsByDayAndBuildingDto {
    const result: ClassroomsByDayAndBuildingDto = {};

    for (const schedule of classrooms) {
      if (!schedule.day || !schedule.isOccupied()) {
        continue;
      }

      const day = schedule.day;
      const building = schedule.classroom.building;

      // Skip online classrooms
      if (schedule.classroom.isOnline()) {
        continue;
      }

      if (!result[day]) {
        result[day] = {};
      }

      if (!result[day][building]) {
        result[day][building] = [];
      }

      result[day][building].push(this.classroomScheduleToScheduleDto(schedule));
    }

    return result;
  }

  static classroomSchedulesToDto(
    schedules: ClassroomSchedule[],
  ): ClassroomDto[] {
    return schedules.map(this.classroomScheduleToDto);
  }

  static classroomSchedulesToScheduleDto(
    schedules: ClassroomSchedule[],
  ): ClassroomScheduleDto[] {
    return schedules.map(this.classroomScheduleToScheduleDto);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectPlan } from '../../domain/entity/subject-plan.model';

export class SubjectPlanResponseDto {
  @ApiProperty({
    description: 'Subject ID',
    example: '93.42',
  })
  subjectId!: string;

  @ApiProperty({
    description: 'Plan ID',
    example: '2023',
  })
  planId!: string;

  @ApiProperty({
    description: 'Section',
    example: 'CIENCIAS_BASICAS',
  })
  section!: string;

  @ApiPropertyOptional({
    description: 'Year',
    example: 1,
    nullable: true,
  })
  year!: number | null;

  @ApiPropertyOptional({
    description: 'Semester',
    example: 1,
    nullable: true,
  })
  semester!: number | null;

  @ApiProperty({
    description: 'Dependencies',
    example: ['93.26', '61.03'],
    type: [String],
  })
  dependencies!: string[];

  @ApiPropertyOptional({
    description: 'Credits required',
    example: 120,
    nullable: true,
  })
  creditsRequired!: number | null;

  @ApiProperty({
    description: 'Subject information',
    example: {
      id: '93.42',
      name: 'Cálculo I',
      credits: 6,
    },
  })
  subject!: {
    id: string;
    name: string;
    credits: number;
  };

  static fromEntity(subjectPlan: SubjectPlan): SubjectPlanResponseDto {
    const dto = new SubjectPlanResponseDto();
    dto.subjectId = subjectPlan.subjectId;
    dto.planId = subjectPlan.planId;
    dto.section = subjectPlan.section;
    dto.year = subjectPlan.year;
    dto.semester = subjectPlan.semester;
    dto.dependencies = subjectPlan.dependencies;
    dto.creditsRequired = subjectPlan.creditsRequired;
    dto.subject = {
      id: subjectPlan.subject.id,
      name: subjectPlan.subject.name,
      credits: subjectPlan.subject.credits,
    };
    return dto;
  }

  static fromEntities(subjectPlans: SubjectPlan[]): SubjectPlanResponseDto[] {
    return subjectPlans.map(sp => SubjectPlanResponseDto.fromEntity(sp));
  }
}

// DTOs for organized subjects view (used by subject.controller.ts)
export class ScheduleDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'MONDAY',
  })
  day!: string;

  @ApiProperty({
    description: 'Classroom name',
    example: '102T',
  })
  classroom!: string;

  @ApiProperty({
    description: 'Building name',
    example: 'SDT',
  })
  building!: string;

  @ApiProperty({
    description: 'Start time',
    example: '14:00:00',
  })
  time_from!: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00:00',
  })
  time_to!: string;
}

export class CommissionDto {
  @ApiProperty({
    description: 'Commission name',
    example: 'A',
  })
  name!: string;

  @ApiProperty({
    description: 'Schedule for this commission',
    type: [ScheduleDto],
  })
  schedule!: ScheduleDto[];
}

export class SubjectDetailDto {
  @ApiProperty({
    description: 'Section name',
    example: 'Ciclo Básico',
  })
  section!: string;

  @ApiProperty({
    description: 'Subject ID',
    example: '31.08',
  })
  subject_id!: string;

  @ApiProperty({
    description: 'Subject name',
    example: 'Sistemas de Representación',
  })
  name!: string;

  @ApiProperty({
    description: 'Number of credits',
    example: 3,
  })
  credits!: number;

  @ApiProperty({
    description: 'Subject dependencies',
    example: ['93.26'],
  })
  dependencies!: string[];

  @ApiProperty({
    description: 'Required credits',
    example: null,
    nullable: true,
  })
  credits_required!: number | null;

  @ApiProperty({
    description: 'Course start date',
    example: '2025-07-21',
  })
  course_start!: string;

  @ApiProperty({
    description: 'Course end date',
    example: '2025-12-31',
  })
  course_end!: string;

  @ApiProperty({
    description: 'Available commissions',
    type: [CommissionDto],
  })
  commissions!: CommissionDto[];
}

export class SemesterSubjectsDto {
  [semester: string]: SubjectDetailDto[];
}

export class YearSubjectsDto {
  [year: string]: SemesterSubjectsDto;
}

export class SectionSubjectsDto {
  [section: string]: YearSubjectsDto;
}

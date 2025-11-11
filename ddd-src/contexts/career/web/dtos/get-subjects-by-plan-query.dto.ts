import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSubjectsByPlanQueryDto {
  @ApiPropertyOptional({
    description: 'Year',
    example: 2024,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: 'Semester',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  semester?: number;

  @ApiPropertyOptional({
    description: 'Section',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({
    description: 'Filter to show only elective subjects',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  electivesOnly?: boolean;
}

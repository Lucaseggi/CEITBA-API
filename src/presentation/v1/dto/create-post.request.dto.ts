import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsISO8601, MinLength } from 'class-validator';

export class CreatePostRequestDto {
  @ApiProperty() @IsString() @MinLength(1)
  title!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  slug?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  excerpt?: string;

  @ApiProperty() @IsString() @MinLength(1)
  markdown!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  organization?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  author?: string;

  @ApiProperty({ enum: ['EVENT','NEWS','ANNOUNCEMENT'] })
  @IsEnum(['EVENT','NEWS','ANNOUNCEMENT'] as any)
  type!: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsISO8601()
  publishedAt?: string;
}

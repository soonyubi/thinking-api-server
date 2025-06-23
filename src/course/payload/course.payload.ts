import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CourseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}

export class CreateCoursePayload {
  @ApiProperty({
    description: '수업명',
    example: '수학 기초',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '수업 설명',
    example: '기초 수학 과정',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '수업 시작일 (YYYY-MM-DD 형식)',
    example: '2024-01-01',
    type: String,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '수업 종료일 (YYYY-MM-DD 형식)',
    example: '2024-12-31',
    type: String,
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: '수업 상태',
    enum: CourseStatus,
    example: CourseStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export class UpdateCoursePayload {
  @ApiProperty({
    description: '수업명',
    example: '수학 기초 (수정됨)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '수업 설명',
    example: '기초 수학 과정 - 수정된 설명',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '수업 시작일 (YYYY-MM-DD 형식)',
    example: '2024-01-01',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '수업 종료일 (YYYY-MM-DD 형식)',
    example: '2024-12-31',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '수업 상태',
    enum: CourseStatus,
    example: CourseStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export interface CourseResponse {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetailResponse extends CourseResponse {
  sessions: CourseSessionResponse[];
  enrollmentCount: number;
}

export class CreateCourseSessionPayload {
  @ApiProperty({
    description: '회차 번호',
    example: 1,
    type: Number,
  })
  @IsNumber()
  sessionNumber: number;

  @ApiProperty({
    description: '회차 제목',
    example: '1차시 - 수의 개념',
    type: String,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '회차 설명',
    example: '기본적인 수의 개념을 배웁니다',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '회차 날짜 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
    type: String,
  })
  @IsDateString()
  sessionDate: string;

  @ApiProperty({
    description: '시작 시간 (HH:MM 형식)',
    example: '09:00',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    description: '종료 시간 (HH:MM 형식)',
    example: '10:30',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class UpdateCourseSessionPayload {
  @ApiProperty({
    description: '회차 번호',
    example: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  sessionNumber?: number;

  @ApiProperty({
    description: '회차 제목',
    example: '1차시 - 수의 개념 (수정됨)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '회차 설명',
    example: '기본적인 수의 개념을 배웁니다 - 수정됨',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '회차 날짜 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiProperty({
    description: '시작 시간 (HH:MM 형식)',
    example: '09:00',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    description: '종료 시간 (HH:MM 형식)',
    example: '10:30',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export interface CourseSessionResponse {
  id: number;
  courseId: number;
  sessionNumber: number;
  title: string;
  description?: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSessionDetailResponse extends CourseSessionResponse {
  classes: CourseClassResponse[];
}

export class CreateCourseClassPayload {
  @ApiProperty({
    description: '분반명',
    example: 'A반',
    type: String,
  })
  @IsString()
  className: string;

  @ApiProperty({
    description: '수용 인원',
    example: 20,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    description: '수업 장소',
    example: '101호',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: '강사 프로필 ID',
    example: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  instructorProfileId?: number;
}

export class UpdateCourseClassPayload {
  @ApiProperty({
    description: '분반명',
    example: 'A반 (수정됨)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiProperty({
    description: '수용 인원',
    example: 25,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    description: '수업 장소',
    example: '102호',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: '강사 프로필 ID',
    example: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  instructorProfileId?: number;
}

export interface CourseClassResponse {
  id: number;
  sessionId: number;
  className: string;
  capacity?: number;
  location?: string;
  instructorProfileId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseClassDetailResponse extends CourseClassResponse {
  attendances: ClassAttendanceResponse[];
  attendanceCount: number;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export class CreateClassAttendancePayload {
  @ApiProperty({
    description: '출석할 프로필 ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  profileId: number;

  @ApiProperty({
    description: '출석 날짜 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
    type: String,
  })
  @IsDateString()
  attendanceDate: string;

  @ApiProperty({
    description: '출석 상태',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class UpdateClassAttendancePayload {
  @ApiProperty({
    description: '출석 상태',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export interface ClassAttendanceResponse {
  id: number;
  classId: number;
  profileId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

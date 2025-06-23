import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum CourseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}

export class CreateCoursePayload {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export class UpdateCoursePayload {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
  @IsNumber()
  sessionNumber: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  sessionDate: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}

export class UpdateCourseSessionPayload {
  @IsOptional()
  @IsNumber()
  sessionNumber?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

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
  @IsString()
  className: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  instructorProfileId?: number;
}

export class UpdateCourseClassPayload {
  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  location?: string;

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
  @IsNumber()
  profileId: number;

  @IsDateString()
  attendanceDate: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class UpdateClassAttendancePayload {
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

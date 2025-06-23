import { IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CoursePermission } from '../enum/course-permission.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GrantPermissionPayload {
  @ApiProperty({
    description: '조직 ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  organizationId: number;

  @ApiProperty({
    description: '권한을 부여할 프로필 ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  profileId: number;

  @ApiProperty({
    description: '부여할 권한',
    enum: CoursePermission,
    example: CoursePermission.CREATE_COURSE,
  })
  @IsEnum(CoursePermission)
  permission: CoursePermission;

  @ApiProperty({
    description: '권한 만료일 (YYYY-MM-DD 형식)',
    example: '2024-12-31',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePermissionPayload {
  @ApiProperty({
    description: '권한 만료일 (YYYY-MM-DD 형식)',
    example: '2024-12-31',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export interface PermissionResponse {
  id: number;
  organizationId: number;
  profileId: number;
  permission: CoursePermission;
  grantedByProfileId: number;
  createdAt: string;
  expiresAt?: string;
  organization?: {
    id: number;
    name: string;
  };
  profile?: {
    id: number;
    name: string;
  };
  grantedBy?: {
    id: number;
    name: string;
  };
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
  permission: CoursePermission;
  organizationId: number;
  profileId: number;
}

export interface PermissionHistoryResponse {
  id: number;
  organizationId: number;
  profileId: number;
  permission: CoursePermission;
  grantedByProfileId: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  organization: {
    id: number;
    name: string;
  };
  profile: {
    id: number;
    name: string;
  };
  grantedBy: {
    id: number;
    name: string;
  };
}

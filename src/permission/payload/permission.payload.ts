import { IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CoursePermission } from '../enum/course-permission.enum';

export class GrantPermissionPayload {
  @IsNumber()
  organizationId: number;

  @IsNumber()
  profileId: number;

  @IsEnum(CoursePermission)
  permission: CoursePermission;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePermissionPayload {
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

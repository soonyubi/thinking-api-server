import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionRepository } from './repositories/permission.repository';
import {
  GrantPermissionPayload,
  UpdatePermissionPayload,
  PermissionResponse,
  PermissionHistoryResponse,
} from './payload/permission.payload';
import { CoursePermission } from './enum/course-permission.enum';

@Injectable()
export class PermissionService {
  constructor(private permissionRepository: PermissionRepository) {}

  async grantPermission(
    grantPermissionDto: GrantPermissionPayload,
    grantedByProfileId: number,
  ): Promise<PermissionResponse> {
    const hasManagePermission = await this.permissionRepository.checkPermission(
      grantedByProfileId,
      grantPermissionDto.organizationId,
      CoursePermission.MANAGE_PERMISSIONS,
    );

    if (!hasManagePermission) {
      throw new ForbiddenException('권한 관리 권한이 없습니다.');
    }

    const existingPermission = await this.permissionRepository.checkPermission(
      grantPermissionDto.profileId,
      grantPermissionDto.organizationId,
      grantPermissionDto.permission,
    );

    if (existingPermission) {
      throw new BadRequestException('이미 해당 권한이 부여되어 있습니다.');
    }

    return this.permissionRepository.grantPermission(
      grantPermissionDto,
      grantedByProfileId,
    );
  }

  async revokePermission(
    organizationId: number,
    profileId: number,
    permission: CoursePermission,
    revokedByProfileId: number,
  ): Promise<void> {
    const hasManagePermission = await this.permissionRepository.checkPermission(
      revokedByProfileId,
      organizationId,
      CoursePermission.MANAGE_PERMISSIONS,
    );

    if (!hasManagePermission) {
      throw new ForbiddenException('권한 관리 권한이 없습니다.');
    }

    await this.permissionRepository.revokePermission(
      organizationId,
      profileId,
      permission,
    );
  }

  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionPayload,
    updatedByProfileId: number,
  ): Promise<PermissionResponse> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException('권한을 찾을 수 없습니다.');
    }

    const hasManagePermission = await this.permissionRepository.checkPermission(
      updatedByProfileId,
      permission.organizationId,
      CoursePermission.MANAGE_PERMISSIONS,
    );

    if (!hasManagePermission) {
      throw new ForbiddenException('권한 관리 권한이 없습니다.');
    }

    return this.permissionRepository.updatePermission(id, updatePermissionDto);
  }

  async getOrganizationPermissions(
    organizationId: number,
  ): Promise<PermissionResponse[]> {
    return this.permissionRepository.findByOrganization(organizationId);
  }

  async getProfilePermissions(
    profileId: number,
  ): Promise<PermissionResponse[]> {
    return this.permissionRepository.findByProfile(profileId);
  }

  async getActivePermissions(
    profileId: number,
    organizationId: number,
  ): Promise<PermissionResponse[]> {
    return this.permissionRepository.findActivePermissions(
      profileId,
      organizationId,
    );
  }

  async checkPermission(
    profileId: number,
    organizationId: number,
    permission: CoursePermission,
  ): Promise<boolean> {
    return this.permissionRepository.checkPermission(
      profileId,
      organizationId,
      permission,
    );
  }

  async getPermissionHistory(
    organizationId: number,
    profileId?: number,
  ): Promise<PermissionHistoryResponse[]> {
    return this.permissionRepository.findPermissionHistory(
      organizationId,
      profileId,
    );
  }

  async getExpiredPermissions(): Promise<PermissionResponse[]> {
    return this.permissionRepository.findExpiredPermissions();
  }

  async validatePermission(
    profileId: number,
    organizationId: number,
    permission: CoursePermission,
  ): Promise<void> {
    const hasPermission = await this.checkPermission(
      profileId,
      organizationId,
      permission,
    );
    if (!hasPermission) {
      throw new ForbiddenException(`해당 권한이 없습니다: ${permission}`);
    }
  }

  async validateAnyPermission(
    profileId: number,
    organizationId: number,
    permissions: CoursePermission[],
  ): Promise<void> {
    for (const permission of permissions) {
      const hasPermission = await this.checkPermission(
        profileId,
        organizationId,
        permission,
      );
      if (hasPermission) {
        return;
      }
    }
    throw new ForbiddenException('필요한 권한이 없습니다.');
  }

  async validateAllPermissions(
    profileId: number,
    organizationId: number,
    permissions: CoursePermission[],
  ): Promise<void> {
    for (const permission of permissions) {
      const hasPermission = await this.checkPermission(
        profileId,
        organizationId,
        permission,
      );
      if (!hasPermission) {
        throw new ForbiddenException(`필요한 권한이 없습니다: ${permission}`);
      }
    }
  }
}

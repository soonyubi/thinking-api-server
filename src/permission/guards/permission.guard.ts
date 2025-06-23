import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../permission.service';
import { CoursePermission } from '../enum/course-permission.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<CoursePermission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.profileId) {
      throw new ForbiddenException('인증이 필요합니다.');
    }

    const organizationId = this.extractOrganizationId(request);
    if (!organizationId) {
      throw new ForbiddenException('조직 ID가 필요합니다.');
    }

    const hasPermission = await this.permissionService.checkPermission(
      user.profileId,
      organizationId,
      requiredPermissions[0],
    );

    if (!hasPermission) {
      throw new ForbiddenException('필요한 권한이 없습니다.');
    }

    return true;
  }

  private extractOrganizationId(request: any): number | null {
    if (request.params.organizationId) {
      return parseInt(request.params.organizationId);
    }

    if (request.body && request.body.organizationId) {
      return parseInt(request.body.organizationId);
    }

    if (request.query && request.query.organizationId) {
      return parseInt(request.query.organizationId);
    }

    return null;
  }
}

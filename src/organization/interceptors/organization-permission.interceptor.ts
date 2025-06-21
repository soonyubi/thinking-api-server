import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OrganizationService } from '../organization.service';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

export interface OrganizationPermissionMetadata {
  requiredRoles: OrganizationRole[];
  organizationIdParam?: string;
}

@Injectable()
export class OrganizationPermissionInterceptor implements NestInterceptor {
  constructor(private organizationService: OrganizationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const metadata = Reflect.getMetadata(
      'organizationPermission',
      context.getHandler(),
    ) as OrganizationPermissionMetadata;

    if (!metadata) {
      return next.handle();
    }

    if (!user?.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    const organizationId = this.extractOrganizationId(
      request,
      metadata.organizationIdParam,
    );

    if (!organizationId) {
      throw new UnauthorizedException('Organization ID is required');
    }

    return from(
      this.checkPermission(
        organizationId,
        user.profileId,
        metadata.requiredRoles,
      ),
    ).pipe(
      switchMap((hasPermission) => {
        if (!hasPermission) {
          throw new UnauthorizedException(
            'Insufficient permissions for this organization',
          );
        }
        return next.handle();
      }),
    );
  }

  private extractOrganizationId(
    request: any,
    paramName: string = 'id',
  ): number {
    const organizationId = request.params[paramName];
    return organizationId ? parseInt(organizationId, 10) : null;
  }

  private async checkPermission(
    organizationId: number,
    profileId: number,
    requiredRoles: OrganizationRole[],
  ): Promise<boolean> {
    return await this.organizationService.checkMemberPermission(
      organizationId,
      profileId,
      requiredRoles,
    );
  }
}

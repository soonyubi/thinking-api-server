import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
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
    const response = context.switchToHttp().getResponse();
    const user = request.user;
    const metadata = Reflect.getMetadata(
      'organizationPermission',
      context.getHandler(),
    ) as OrganizationPermissionMetadata;

    if (
      !metadata ||
      !metadata.requiredRoles ||
      metadata.requiredRoles.length === 0
    ) {
      return next.handle();
    }

    if (!user?.profileId || user.profileId === 0) {
      response.status(HttpStatus.UNAUTHORIZED);
      return from(
        Promise.resolve({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Profile required for this operation',
          error: 'Unauthorized',
        }),
      );
    }

    const organizationId = this.extractOrganizationId(
      request,
      metadata.organizationIdParam,
    );

    if (!organizationId) {
      response.status(HttpStatus.BAD_REQUEST);
      return from(
        Promise.resolve({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Organization ID is required',
          error: 'Bad Request',
        }),
      );
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
          response.status(HttpStatus.FORBIDDEN);
          return from(
            Promise.resolve({
              statusCode: HttpStatus.FORBIDDEN,
              message: 'Insufficient permissions for this organization',
              error: 'Forbidden',
            }),
          );
        }
        return next.handle();
      }),
    );
  }

  private extractOrganizationId(
    request: any,
    paramName: string = 'id',
  ): number | null {
    const organizationId = request.params[paramName];
    if (!organizationId) {
      return null;
    }

    const parsedId = parseInt(organizationId, 10);
    return isNaN(parsedId) ? null : parsedId;
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

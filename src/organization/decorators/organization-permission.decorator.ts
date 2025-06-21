import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

export const ORGANIZATION_PERMISSION_KEY = 'organizationPermission';

export interface OrganizationPermissionMetadata {
  requiredRoles: OrganizationRole[];
  organizationIdParam?: string;
}

export const OrganizationPermission = (
  requiredRoles: OrganizationRole[],
  organizationIdParam: string = 'id',
) =>
  SetMetadata(ORGANIZATION_PERMISSION_KEY, {
    requiredRoles,
    organizationIdParam,
  } as OrganizationPermissionMetadata);

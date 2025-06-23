import { SetMetadata } from '@nestjs/common';
import { CoursePermission } from '../enum/course-permission.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...permissions: CoursePermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

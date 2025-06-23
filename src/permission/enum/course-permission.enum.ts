export enum CoursePermission {
  CREATE_COURSE = 'course:create',
  UPDATE_COURSE = 'course:update',
  DELETE_COURSE = 'course:delete',
  MANAGE_ENROLLMENTS = 'course:enrollment:manage',
  MANAGE_ATTENDANCE = 'course:attendance:manage',
  ASSIGN_INSTRUCTOR = 'course:instructor:assign',
  VIEW_COURSE_DETAILS = 'course:view',
  MANAGE_SESSIONS = 'course:session:manage',
  MANAGE_CLASSES = 'course:class:manage',
  MANAGE_PERMISSIONS = 'permission:manage',
}

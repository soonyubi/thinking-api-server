import {
  mysqlTable,
  varchar,
  timestamp,
  date,
  int,
  uniqueIndex,
  index,
  text,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = mysqlTable('profiles', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id')
    .references(() => users.id)
    .notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  birthDate: date('birth_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizations = mysqlTable('organizations', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  mainAdminProfileId: int('main_admin_profile_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profileOrganization = mysqlTable(
  'profile_organization',
  {
    id: int('id').primaryKey().autoincrement(),
    profileId: int('profile_id')
      .references(() => profiles.id)
      .notNull(),
    organizationId: int('organization_id')
      .references(() => organizations.id)
      .notNull(),
    roleInOrg: varchar('role_in_org', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    profileOrgUnique: uniqueIndex('profile_org_unique').on(
      table.profileId,
      table.organizationId,
    ),
    roleInOrgIdx: index('role_in_org_idx').on(table.roleInOrg),
  }),
);

export const organizationPermissions = mysqlTable(
  'organization_permissions',
  {
    id: int('id').primaryKey().autoincrement(),
    organizationId: int('organization_id')
      .references(() => organizations.id)
      .notNull(),
    profileId: int('profile_id')
      .references(() => profiles.id)
      .notNull(),
    permission: varchar('permission', { length: 100 }).notNull(),
    grantedByProfileId: int('granted_by_profile_id')
      .references(() => profiles.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    orgProfilePermissionUnique: uniqueIndex('org_profile_permission_unique').on(
      table.organizationId,
      table.profileId,
      table.permission,
    ),
    permissionIdx: index('permission_idx').on(table.permission),
  }),
);

export const profileRelationships = mysqlTable('profile_relationships', {
  id: int('id').primaryKey().autoincrement(),
  parentProfileId: int('parent_profile_id')
    .references(() => profiles.id)
    .notNull(),
  childProfileId: int('child_profile_id')
    .references(() => profiles.id)
    .notNull(),
  relationType: varchar('relation_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  parentRelationships: many(profileRelationships, {
    relationName: 'parentProfile',
  }),
  childRelationships: many(profileRelationships, {
    relationName: 'childProfile',
  }),
  organizationMemberships: many(profileOrganization),
  mainAdminOrganizations: many(organizations, {
    relationName: 'mainAdmin',
  }),
  courseEnrollments: many(courseEnrollments),
  classAttendances: many(classAttendances),
  instructedClasses: many(courseClasses),
  grantedPermissions: many(organizationPermissions, {
    relationName: 'grantedBy',
  }),
  receivedPermissions: many(organizationPermissions, {
    relationName: 'receivedBy',
  }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    mainAdminProfile: one(profiles, {
      fields: [organizations.mainAdminProfileId],
      references: [profiles.id],
      relationName: 'mainAdmin',
    }),
    members: many(profileOrganization),
    courses: many(courses),
    permissions: many(organizationPermissions),
  }),
);

export const profileOrganizationRelations = relations(
  profileOrganization,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [profileOrganization.profileId],
      references: [profiles.id],
    }),
    organization: one(organizations, {
      fields: [profileOrganization.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const organizationPermissionsRelations = relations(
  organizationPermissions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationPermissions.organizationId],
      references: [organizations.id],
    }),
    profile: one(profiles, {
      fields: [organizationPermissions.profileId],
      references: [profiles.id],
      relationName: 'receivedBy',
    }),
    grantedBy: one(profiles, {
      fields: [organizationPermissions.grantedByProfileId],
      references: [profiles.id],
      relationName: 'grantedBy',
    }),
  }),
);

export const profileRelationshipsRelations = relations(
  profileRelationships,
  ({ one }) => ({
    parentProfile: one(profiles, {
      fields: [profileRelationships.parentProfileId],
      references: [profiles.id],
      relationName: 'parentProfile',
    }),
    childProfile: one(profiles, {
      fields: [profileRelationships.childProfileId],
      references: [profiles.id],
      relationName: 'childProfile',
    }),
  }),
);

export const userSessions = mysqlTable(
  'user_sessions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .references(() => users.id)
      .notNull(),
    lastProfileId: int('last_profile_id').references(() => profiles.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdUnique: uniqueIndex('user_sessions_user_id_unique').on(table.userId),
  }),
);

export const courses = mysqlTable('courses', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: mysqlEnum('status', ['active', 'inactive', 'completed'])
    .default('active')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const courseSessions = mysqlTable(
  'course_sessions',
  {
    id: int('id').primaryKey().autoincrement(),
    courseId: int('course_id')
      .references(() => courses.id)
      .notNull(),
    sessionNumber: int('session_number').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    sessionDate: date('session_date').notNull(),
    startTime: varchar('start_time', { length: 10 }),
    endTime: varchar('end_time', { length: 10 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseSessionUnique: uniqueIndex('course_session_unique').on(
      table.courseId,
      table.sessionNumber,
    ),
  }),
);

export const courseClasses = mysqlTable(
  'course_classes',
  {
    id: int('id').primaryKey().autoincrement(),
    sessionId: int('session_id')
      .references(() => courseSessions.id)
      .notNull(),
    className: varchar('class_name', { length: 50 }).notNull(),
    capacity: int('capacity'),
    location: varchar('location', { length: 200 }),
    instructorProfileId: int('instructor_profile_id').references(
      () => profiles.id,
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionClassUnique: uniqueIndex('session_class_unique').on(
      table.sessionId,
      table.className,
    ),
  }),
);

export const courseEnrollments = mysqlTable(
  'course_enrollments',
  {
    id: int('id').primaryKey().autoincrement(),
    courseId: int('course_id')
      .references(() => courses.id)
      .notNull(),
    profileId: int('profile_id')
      .references(() => profiles.id)
      .notNull(),
    enrollmentDate: timestamp('enrollment_date').defaultNow().notNull(),
    status: mysqlEnum('status', ['enrolled', 'dropped', 'completed'])
      .default('enrolled')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseProfileUnique: uniqueIndex('course_profile_unique').on(
      table.courseId,
      table.profileId,
    ),
  }),
);

export const classAttendances = mysqlTable(
  'class_attendances',
  {
    id: int('id').primaryKey().autoincrement(),
    classId: int('class_id')
      .references(() => courseClasses.id)
      .notNull(),
    profileId: int('profile_id')
      .references(() => profiles.id)
      .notNull(),
    attendanceDate: date('attendance_date').notNull(),
    status: mysqlEnum('status', ['present', 'absent', 'late', 'excused'])
      .default('present')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    classProfileDateUnique: uniqueIndex('class_profile_date_unique').on(
      table.classId,
      table.profileId,
      table.attendanceDate,
    ),
  }),
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [courses.organizationId],
    references: [organizations.id],
  }),
  sessions: many(courseSessions),
  enrollments: many(courseEnrollments),
}));

export const courseSessionsRelations = relations(
  courseSessions,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [courseSessions.courseId],
      references: [courses.id],
    }),
    classes: many(courseClasses),
  }),
);

export const courseClassesRelations = relations(
  courseClasses,
  ({ one, many }) => ({
    session: one(courseSessions, {
      fields: [courseClasses.sessionId],
      references: [courseSessions.id],
    }),
    instructor: one(profiles, {
      fields: [courseClasses.instructorProfileId],
      references: [profiles.id],
    }),
    attendances: many(classAttendances),
  }),
);

export const courseEnrollmentsRelations = relations(
  courseEnrollments,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseEnrollments.courseId],
      references: [courses.id],
    }),
    profile: one(profiles, {
      fields: [courseEnrollments.profileId],
      references: [profiles.id],
    }),
  }),
);

export const classAttendancesRelations = relations(
  classAttendances,
  ({ one }) => ({
    class: one(courseClasses, {
      fields: [classAttendances.classId],
      references: [courseClasses.id],
    }),
    profile: one(profiles, {
      fields: [classAttendances.profileId],
      references: [profiles.id],
    }),
  }),
);

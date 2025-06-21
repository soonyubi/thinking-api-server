import {
  mysqlTable,
  varchar,
  timestamp,
  date,
  int,
  uniqueIndex,
  index,
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

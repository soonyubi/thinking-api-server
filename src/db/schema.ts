import {
  mysqlTable,
  varchar,
  timestamp,
  date,
  int,
} from 'drizzle-orm/mysql-core';

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profileOrganization = mysqlTable('profile_organization', {
  id: int('id').primaryKey().autoincrement(),
  profileId: int('profile_id')
    .references(() => profiles.id)
    .notNull(),
  organizationId: int('organization_id')
    .references(() => organizations.id)
    .notNull(),
  roleInOrg: varchar('role_in_org', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

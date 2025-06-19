import {
  mysqlTable,
  varchar,
  timestamp,
  date,
  int,
  uniqueIndex,
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

export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

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

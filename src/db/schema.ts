import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull().unique(),
  userId: integer('user_id'),
  name: text('name'),
  username: text('username'),
  token: text('token'),
  firstSeen: text('first_seen').notNull(),
  lastSeen: text('last_seen').notNull(),
});

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userUuid: text('user_uuid').references(() => users.uuid).notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userUuid: text('user_uuid').references(() => users.uuid).notNull(),
  name: text('name').notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const records = sqliteTable('records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userUuid: text('user_uuid').references(() => users.uuid).notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  isAssignedGrading: integer('is_assigned_grading', { mode: 'boolean' }).notNull().default(false),
  score: real('score'),
  rawScore: real('raw_score'),
  assignedScore: real('assigned_score'),
  classRank: integer('class_rank'),
  gradeRank: integer('grade_rank'),
  reflection: text('reflection'),
  peerScores: text('peer_scores'), // JSON string
});

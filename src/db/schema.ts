import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const records = sqliteTable('records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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

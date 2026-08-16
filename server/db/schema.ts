import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userProfile = pgTable('user_profile', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  city: text('city').notNull().default('القاهرة'),
  dayStart: text('day_start').notNull().default('08:00'),
  workWindow: text('work_window').notNull().default('09:00 - 17:00'),
  focusGoal: text('focus_goal').notNull().default('إنجاز أهم خطوة كل يوم'),
  onboardingComplete: boolean('onboarding_complete').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const religiousSettings = pgTable('religious_settings', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  city: text('city').notNull().default('القاهرة'),
  calculationMethod: text('calculation_method').notNull().default('مخصص'),
  prayerLogs: jsonb('prayer_logs').notNull().default([]),
  quranProgress: jsonb('quran_progress').notNull().default({}),
  dhikrSessions: jsonb('dhikr_sessions').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const goal = pgTable('goal', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  horizon: text('horizon').notNull().default('quarter'),
  status: text('status').notNull().default('active'),
  progress: integer('progress').notNull().default(0),
  targetLabel: text('target_label').notNull().default(''),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  goalUserUpdatedIndex: uniqueIndex('goal_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const project = pgTable('project', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  goalId: text('goal_id').references(() => goal.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('backlog'),
  progress: integer('progress').notNull().default(0),
  dueLabel: text('due_label').notNull().default('بدون موعد'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectUserUpdatedIndex: uniqueIndex('project_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const task = pgTable('task', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('todo'),
  dueDate: text('due_date'),
  dueLabel: text('due_label'),
  category: text('category').notNull().default('عام'),
  recurring: boolean('recurring').notNull().default(false),
  projectId: text('project_id'),
  sourceNoteId: text('source_note_id'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userUpdatedIndex: uniqueIndex('task_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const subtask = pgTable('subtask', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  taskId: text('task_id').notNull().references(() => task.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const note = pgTable('note', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  tag: text('tag').notNull().default('عام'),
  pinned: boolean('pinned').notNull().default(false),
  sourceTaskId: text('source_task_id'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const habit = pgTable('habit', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  icon: text('icon').notNull().default('عادة'),
  target: text('target').notNull().default('يوميًا'),
  frequency: text('frequency').notNull().default('daily'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const habitLog = pgTable('habit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').notNull().references(() => habit.id, { onDelete: 'cascade' }),
  localDate: text('local_date').notNull(),
  status: text('status').notNull().default('done'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  habitDateIndex: uniqueIndex('habit_log_user_habit_date_idx').on(table.userId, table.habitId, table.localDate),
}))

export const dailyPlanItem = pgTable('daily_plan_item', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  localDate: text('local_date').notNull(),
  kind: text('kind').notNull(),
  sourceId: text('source_id'),
  title: text('title').notNull(),
  startAt: text('start_at'),
  endAt: text('end_at'),
  status: text('status').notNull().default('pending'),
  position: integer('position').notNull().default(0),
  isManualOverride: boolean('is_manual_override').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const financeEntry = pgTable('finance_entry', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  kind: text('kind').notNull().default('expense'),
  category: text('category').notNull().default('عام'),
  localDate: text('local_date').notNull(),
  note: text('note'),
  projectId: text('project_id').references(() => project.id, { onDelete: 'set null' }),
  goalId: text('goal_id').references(() => goal.id, { onDelete: 'set null' }),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  financeUserUpdatedIndex: uniqueIndex('finance_entry_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const budget = pgTable('budget', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  monthlyLimit: integer('monthly_limit').notNull().default(12000),
  currency: text('currency').notNull().default('جنيه'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const reminder = pgTable('reminder', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  kind: text('kind').notNull().default('task'),
  dueAt: text('due_at').notNull(),
  status: text('status').notNull().default('pending'),
  sourceId: text('source_id'),
  repeatLabel: text('repeat_label'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  reminderUserUpdatedIndex: uniqueIndex('reminder_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const journalEntry = pgTable('journal_entry', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  localDate: text('local_date').notNull(),
  title: text('title').notNull().default('يومياتي'),
  body: text('body').notNull().default(''),
  mood: text('mood').notNull().default('محايد'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  journalUserDateIndex: uniqueIndex('journal_entry_user_date_idx').on(table.userId, table.localDate),
}))

export const entertainmentItem = pgTable('entertainment_item', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull().default('movie'),
  genre: text('genre').notNull().default('عام'),
  year: integer('year'),
  note: text('note'),
  status: text('status').notNull().default('want'),
  rating: integer('rating'),
  impression: text('impression'),
  recommend: boolean('recommend').notNull().default(false),
  downloadWanted: boolean('download_wanted').notNull().default(false),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  entertainmentUserUpdatedIndex: uniqueIndex('entertainment_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const weeklyReview = pgTable('weekly_review', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  weekStart: text('week_start').notNull(),
  weekEnd: text('week_end').notNull(),
  wentWell: text('went_well'),
  blockers: text('blockers'),
  nextGoal: text('next_goal'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userWeekIndex: uniqueIndex('weekly_review_user_week_idx').on(table.userId, table.weekStart),
}))

export const schema = {
  user,
  session,
  account,
  verification,
  userProfile,
  goal,
  project,
  task,
  subtask,
  note,
  habit,
  habitLog,
  dailyPlanItem,
  weeklyReview,
  financeEntry,
  budget,
  reminder,
  journalEntry,
  entertainmentItem,
}

export type GoalRecord = typeof goal.$inferSelect
export type ProjectRecord = typeof project.$inferSelect
export type TaskRecord = typeof task.$inferSelect
export type NoteRecord = typeof note.$inferSelect
export type UserProfileRecord = typeof userProfile.$inferSelect
export type FinanceEntryRecord = typeof financeEntry.$inferSelect
export type BudgetRecord = typeof budget.$inferSelect
export type ReminderRecord = typeof reminder.$inferSelect
export type JournalEntryRecord = typeof journalEntry.$inferSelect
export type EntertainmentItemRecord = typeof entertainmentItem.$inferSelect

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

export const workspace = pgTable('workspace', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('personal'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceOwnerIndex: uniqueIndex('workspace_owner_updated_idx').on(table.ownerId, table.updatedAt),
}))

export const workspaceMember = pgTable('workspace_member', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceMemberUniqueIndex: uniqueIndex('workspace_member_workspace_user_idx').on(table.workspaceId, table.userId),
}))

export const workspaceInvitation = pgTable('workspace_invitation', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  invitedEmail: text('invited_email').notNull(),
  role: text('role').notNull().default('member'),
  tokenHash: text('token_hash').notNull(),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  invitationTokenIndex: uniqueIndex('workspace_invitation_token_idx').on(table.tokenHash),
}))

export const client = pgTable('client', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const clientCredential = pgTable('client_credential', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => client.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  label: text('label').notNull(),
  username: text('username'),
  loginUrl: text('login_url'),
  secretValue: text('secret_value'),
  notes: text('notes'),
  isExperimental: boolean('is_experimental').notNull().default(true),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const calendarEvent = pgTable('calendar_event', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  kind: text('kind').notNull().default('general'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  timezone: text('timezone').notNull().default('Africa/Cairo'),
  sourceType: text('source_type'),
  sourceId: text('source_id'),
  status: text('status').notNull().default('planned'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const libraryResource = pgTable('library_resource', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
  projectId: text('project_id'),
  type: text('type').notNull().default('link'),
  title: text('title').notNull(),
  url: text('url'),
  description: text('description'),
  tags: jsonb('tags').notNull().default([]),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const activitySession = pgTable('activity_session', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  source: text('source').notNull().default('windows-agent'),
  appName: text('app_name').notNull(),
  windowTitle: text('window_title'),
  browserDomain: text('browser_domain'),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  idleSeconds: integer('idle_seconds').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const secondFactorSetting = pgTable('second_factor_setting', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('disabled'),
  method: text('method').notNull().default('totp'),
  secret: text('secret'),
  recoveryCodes: jsonb('recovery_codes').notNull().default([]),
  isExperimental: boolean('is_experimental').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const religiousSettings = pgTable('religious_settings', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  city: text('city').notNull().default('القاهرة'),
  calculationMethod: text('calculation_method').notNull().default('مخصص'),
  prayerLogs: jsonb('prayer_logs').notNull().default([]),
  prayerHistory: jsonb('prayer_history').notNull().default([]),
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
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'set null' }),
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
  projectWorkspaceUpdatedIndex: uniqueIndex('project_workspace_updated_idx').on(table.workspaceId, table.updatedAt),
}))

export const projectUpdate = pgTable('project_update', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  kind: text('kind').notNull().default('progress'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const projectPricing = pgTable('project_pricing', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('جنيه'),
  status: text('status').notNull().default('expected'),
  expectedDate: text('expected_date'),
  receivedAt: timestamp('received_at'),
  financeEntryId: text('finance_entry_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const projectShare = pgTable('project_share', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  memberUserId: text('member_user_id').references(() => user.id, { onDelete: 'cascade' }),
  invitedEmail: text('invited_email'),
  role: text('role').notNull().default('viewer'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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
  taskId: text('task_id').references(() => task.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => project.id, { onDelete: 'set null' }),
  goalId: text('goal_id').references(() => goal.id, { onDelete: 'set null' }),
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
  recurrence: text('recurrence').notNull().default('none'),
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
  workspace,
  workspaceMember,
  workspaceInvitation,
  client,
  clientCredential,
  calendarEvent,
  libraryResource,
  activitySession,
  secondFactorSetting,
  projectUpdate,
  projectPricing,
  projectShare,
  financeEntry,
  budget,
  reminder,
  journalEntry,
  entertainmentItem,
}

export type GoalRecord = typeof goal.$inferSelect
export type ProjectRecord = typeof project.$inferSelect
export type WorkspaceRecord = typeof workspace.$inferSelect
export type WorkspaceMemberRecord = typeof workspaceMember.$inferSelect
export type ClientRecord = typeof client.$inferSelect
export type ClientCredentialRecord = typeof clientCredential.$inferSelect
export type CalendarEventRecord = typeof calendarEvent.$inferSelect
export type LibraryResourceRecord = typeof libraryResource.$inferSelect
export type ActivitySessionRecord = typeof activitySession.$inferSelect
export type TaskRecord = typeof task.$inferSelect
export type NoteRecord = typeof note.$inferSelect
export type UserProfileRecord = typeof userProfile.$inferSelect
export type FinanceEntryRecord = typeof financeEntry.$inferSelect
export type BudgetRecord = typeof budget.$inferSelect
export type ReminderRecord = typeof reminder.$inferSelect
export type JournalEntryRecord = typeof journalEntry.$inferSelect
export type EntertainmentItemRecord = typeof entertainmentItem.$inferSelect

'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { archiveRemoteEntertainment, archiveRemoteFinanceEntry, archiveRemoteGoal, archiveRemoteHabit, archiveRemoteJournal, archiveRemoteNote, archiveRemoteProject, archiveRemoteSubtask, archiveRemoteTask, archiveRemoteReminder, createRemoteEntertainment, createRemoteFinanceEntry, createRemoteHabit, createRemoteJournal, createRemoteReminder, createRemoteGoal, createRemoteNote, createRemoteProject, createRemoteSubtask, createRemoteTask, hydrateRemoteData, toggleRemoteHabit, updateRemoteBudget, updateRemoteEntertainment, updateRemoteFinanceEntry, updateRemoteGoal, updateRemoteJournal, updateRemoteNote, updateRemotePlanItem, updateRemoteProfile, updateRemoteProject, updateRemoteReligious, updateRemoteReminder, updateRemoteSubtask, updateRemoteTask, updateRemoteWeeklyReview, restoreRemoteArchive } from './backend-sync'
import { nextReminderDueAt, normalizeReminderRepeatLabel } from './reminder-utils'

type Priority = 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in-progress' | 'done'
export type GoalStatus = 'active' | 'paused' | 'completed'
export type GoalHorizon = 'quarter' | 'year' | 'someday'
export type ProjectStatus = 'backlog' | 'in-progress' | 'paused' | 'done'
export type FinanceKind = 'expense' | 'income'
export type FinanceRecurrence = 'none' | 'weekly' | 'monthly'
export type ReminderKind = 'task' | 'habit' | 'prayer' | 'quran' | 'finance'
export type ReminderStatus = 'pending' | 'done' | 'snoozed'

export type Profile = {
  name: string
  city: string
  dayStart: string
  workWindow: string
  focusGoal: string
  onboardingComplete: boolean
}

export type Task = {
  id: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  dueLabel: string
  category: string
  recurring?: boolean
  subtasks?: { id: string; title: string; done: boolean }[]
  sourceNoteId?: string
  projectId?: string
}

export type Goal = {
  id: string
  title: string
  description: string
  horizon: GoalHorizon
  status: GoalStatus
  progress: number
  targetLabel: string
}

export type Project = {
  id: string
  title: string
  description: string
  goalId?: string
  status: ProjectStatus
  progress: number
  dueLabel: string
}

export type FinanceEntry = {
  id: string
  title: string
  amount: number
  kind: FinanceKind
  category: string
  localDate: string
  note?: string
  projectId?: string
  goalId?: string
  recurrence: FinanceRecurrence
}

export type Budget = {
  monthlyLimit: number
  currency: string
}

export type Reminder = {
  id: string
  title: string
  kind: ReminderKind
  dueAt: string
  status: ReminderStatus
  sourceId?: string
  repeatLabel?: string
}

export type EntertainmentStatus = 'want' | 'watching' | 'completed'
export type EntertainmentType = 'movie' | 'series'

export type EntertainmentItem = {
  id: string
  title: string
  type: EntertainmentType
  genre: string
  year?: number
  note?: string
  status: EntertainmentStatus
  rating?: number
  impression?: string
  recommend: boolean
  downloadWanted: boolean
  createdAt: string
}

export type PrayerStatus = 'pending' | 'done' | 'on-time' | 'congregation' | 'qada' | 'missed'

export function isPrayerCompletedStatus(status: PrayerStatus) {
  return status === 'done' || status === 'on-time' || status === 'congregation' || status === 'qada'
}

export type PrayerLog = {
  id: string
  name: string
  time: string
  status: PrayerStatus
  localDate: string
}

export type PrayerHistoryDay = {
  localDate: string
  completed: number
  total: number
  statusCounts?: Partial<Record<PrayerStatus, number>>
  missedByPrayer?: Record<string, number>
}

export type QuranPosition = {
  surahNumber: number
  positionSeconds: number
  ayahNumber?: number
  reciterId?: number
  updatedAt: string
}

export type QuranPlaylist = {
  id: string
  name: string
  surahNumbers: number[]
  createdAt: string
}

export type QuranFavoriteAyah = {
  id: string
  surahNumber: number
  ayahNumber: number
  reflection: string
  createdAt: string
}

export type SunnahKey = 'duha' | 'witr' | 'rawatib' | 'sadaqah'
export type MemorizationSurahStatus = 'memorized' | 'reviewing' | 'learning'

export type ReligiousState = {
  city: string
  calculationMethod: string
  prayerLogs: PrayerLog[]
  prayerHistory?: PrayerHistoryDay[]
  quran: { reference: string; targetMinutes: number; completedMinutes: number; memorizationTarget?: number; memorizationCompleted?: number; memorizationSurahStatus?: Record<number, MemorizationSurahStatus>; lastPosition?: QuranPosition; playlists?: QuranPlaylist[]; favoriteAyahs?: QuranFavoriteAyah[]; listenLater?: number[]; listenedSurahNumbers?: number[] }
  dhikr: { morning: boolean; evening: boolean; morningCount?: number; eveningCount?: number; morningProgress?: Record<string, number>; eveningProgress?: Record<string, number>; lastSession?: string; tasbeehCount?: number; tasbeehTarget?: number; savedDuas?: string[]; sunnahChecks?: Record<SunnahKey, boolean> }
}

export type Note = {
  id: string
  title: string
  body: string
  tag: string
  pinned: boolean
  createdAt: string
  sourceTaskId?: string
}

export type Habit = {
  id: string
  title: string
  icon: string
  streak: number
  doneToday: boolean
  target: string
  frequency?: 'daily' | 'weekly'
  history?: Record<string, boolean>
  taskId?: string
  projectId?: string
  goalId?: string
}

export type PlanItem = {
  id: string
  time: string
  title: string
  kind: 'task' | 'habit' | 'prayer' | 'quran' | 'rest'
  sourceId?: string
  localDate?: string
  status: 'pending' | 'done' | 'snoozed' | 'skipped'
}

export type WeeklyReview = {
  id: string
  weekStart: string
  weekEnd: string
  wentWell: string
  blockers: string
  nextGoal: string
  status: 'draft' | 'completed'
  updatedAt: string
}

export type JournalEntry = {
  id: string
  localDate: string
  title: string
  body: string
  mood: 'سعيد' | 'هادئ' | 'محايد' | 'متعب' | 'متوتر'
  createdAt: string
  updatedAt: string
}

export type BoardArchivePayload = {
  id: string
  title: string
  body: string
  lane: 'ideas' | 'next' | 'doing' | 'done'
  color: 'yellow' | 'blue' | 'green' | 'pink'
  createdAt: string
  x: number
  y: number
  boardId: string
  boardTitle: string
}

export type ArchiveKind = 'task' | 'note' | 'habit' | 'goal' | 'project' | 'finance' | 'reminder' | 'entertainment' | 'journal' | 'board'
export type ArchivedPayload = Task | Note | Habit | Goal | Project | FinanceEntry | Reminder | EntertainmentItem | JournalEntry | BoardArchivePayload
export type ArchivedItem = {
  id: string
  kind: ArchiveKind
  title: string
  subtitle: string
  archivedAt: string
  payload: ArchivedPayload
}

type CommandCenterContextValue = {
  exportData: () => string
  importData: (raw: string) => { ok: boolean; message: string }
  resetLocalData: () => void
  profile: Profile
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  planItems: PlanItem[]
  goals: Goal[]
  projects: Project[]
  financeEntries: FinanceEntry[]
  budget: Budget
  religious: ReligiousState
  reminders: Reminder[]
  entertainment: EntertainmentItem[]
  journal: JournalEntry[]
  weeklyReview: WeeklyReview
  archive: ArchivedItem[]
  updateProfile: (patch: Partial<Profile>) => void
  completeOnboarding: (profile: Omit<Profile, 'onboardingComplete'>) => void
  toggleTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  removeSubtask: (taskId: string, subtaskId: string) => void
  addTask: (input: Pick<Task, 'title' | 'priority' | 'dueLabel' | 'category'> & Partial<Pick<Task, 'description' | 'recurring' | 'projectId'>>) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  archiveTask: (id: string) => void
  addGoal: (input: Pick<Goal, 'title' | 'horizon' | 'targetLabel'> & Partial<Pick<Goal, 'description' | 'status' | 'progress'>>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  archiveGoal: (id: string) => void
  addProject: (input: Pick<Project, 'title' | 'dueLabel'> & Partial<Pick<Project, 'description' | 'goalId' | 'status' | 'progress'>>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  archiveProject: (id: string) => void
  addFinanceEntry: (input: Pick<FinanceEntry, 'title' | 'amount' | 'kind' | 'category' | 'localDate'> & Partial<Pick<FinanceEntry, 'note' | 'projectId' | 'goalId' | 'recurrence'>>) => void
  updateFinanceEntry: (id: string, patch: Partial<FinanceEntry>) => void
  archiveFinanceEntry: (id: string) => void
  updateBudget: (monthlyLimit: number) => void
  togglePrayer: (id: string, status?: PrayerStatus) => void
  addWirdProgress: (minutes: number) => void
  setWirdTarget: (minutes: number) => void
  toggleDhikr: (session: 'morning' | 'evening') => void
  incrementDhikr: (session: 'morning' | 'evening', itemId: string, target?: number) => void
  addTasbeeh: (count?: number) => void
  setTasbeehTarget: (target: number) => void
  resetTasbeeh: () => void
  addSavedDua: (text: string) => void
  removeSavedDua: (index: number) => void
  updateReligiousSettings: (patch: Pick<ReligiousState, 'city' | 'calculationMethod'>) => void
  updatePrayerTimes: (times: Partial<Record<PrayerLog['name'], string>>) => void
  toggleSunnah: (key: SunnahKey) => void
  setMemorizationSurahStatus: (surahNumber: number, status: MemorizationSurahStatus) => void
  addMemorizationProgress: (ayahs: number) => void
  saveQuranPosition: (position: Omit<QuranPosition, 'updatedAt'>) => void
  createQuranPlaylist: (name: string, surahNumber?: number) => void
  toggleQuranPlaylistSurah: (playlistId: string, surahNumber: number) => void
  saveQuranFavoriteAyah: (input: Pick<QuranFavoriteAyah, 'surahNumber' | 'ayahNumber'> & Partial<Pick<QuranFavoriteAyah, 'reflection'>>) => void
  removeQuranFavoriteAyah: (id: string) => void
  toggleQuranListenLater: (surahNumber: number) => void
  toggleQuranListened: (surahNumber: number) => void
  addReminder: (input: Pick<Reminder, 'title' | 'kind' | 'dueAt'> & Partial<Pick<Reminder, 'sourceId' | 'repeatLabel'>>) => void
  toggleReminder: (id: string) => void
  snoozeReminder: (id: string) => void
  archiveReminder: (id: string) => void
  addEntertainment: (input: Pick<EntertainmentItem, 'title' | 'type' | 'genre'> & Partial<Pick<EntertainmentItem, 'year' | 'note' | 'status' | 'rating' | 'impression' | 'recommend' | 'downloadWanted'>>) => void
  updateEntertainment: (id: string, patch: Partial<EntertainmentItem>) => void
  moveEntertainment: (id: string, status: EntertainmentStatus) => void
  archiveEntertainment: (id: string) => void
  saveJournalEntry: (input: Pick<JournalEntry, 'localDate' | 'title' | 'body' | 'mood'> & Partial<Pick<JournalEntry, 'id'>>) => void
  updateJournalEntry: (id: string, patch: Partial<Pick<JournalEntry, 'localDate' | 'title' | 'body' | 'mood'>>) => void
  archiveJournalEntry: (id: string) => void
  archiveHabit: (id: string) => void
  archiveBoardNote: (payload: BoardArchivePayload) => void
  addHabit: (input: Pick<Habit, 'title' | 'target'> & Partial<Pick<Habit, 'icon' | 'frequency' | 'taskId' | 'projectId' | 'goalId'>>) => void
  restoreArchivedItem: (id: string) => void
  saveWeeklyReview: (patch: Pick<WeeklyReview, 'wentWell' | 'blockers' | 'nextGoal'> & Partial<Pick<WeeklyReview, 'status'>>) => void
  addNote: (input: Pick<Note, 'title' | 'body' | 'tag'>) => void
  toggleNotePin: (id: string) => void
  archiveNote: (id: string) => void
  toggleHabit: (id: string) => void
  togglePlanItem: (id: string) => void
  updatePlanItem: (id: string, patch: Partial<Pick<PlanItem, 'title' | 'time'>>) => void
  movePlanItem: (id: string, localDate: string) => void
  snoozePlanItem: (id: string) => void
  skipPlanItem: (id: string) => void
  restorePlanItem: (id: string) => void
}

const initialProfile: Profile = {
  name: 'كابتن',
  city: 'القاهرة',
  dayStart: '08:00',
  workWindow: '09:00 - 17:00',
  focusGoal: 'إنجاز أهم خطوة كل يوم',
  onboardingComplete: false,
}

const initialTasks: Task[] = [
  { id: 'task-1', title: 'مراجعة تقرير الشغل الأسبوعي', priority: 'high', status: 'done', dueLabel: 'النهاردة', category: 'شغل' },
  { id: 'task-2', title: 'الرد على رسائل البريد المتأخرة', priority: 'medium', status: 'done', dueLabel: 'النهاردة', category: 'شغل' },
  { id: 'task-3', title: 'تحضير عرض تقديمي للمشروع', priority: 'high', status: 'in-progress', dueLabel: 'النهاردة', category: 'مشروع', projectId: 'project-1' },
  { id: 'task-4', title: 'حجز موعد الدكتور', priority: 'low', status: 'todo', dueLabel: 'النهاردة', category: 'شخصي' },
  { id: 'task-5', title: 'شراء مستلزمات البيت', priority: 'medium', status: 'todo', dueLabel: 'بكرة', category: 'شخصي' },
  { id: 'task-6', title: 'قراءة فصل من الكتاب', priority: 'low', status: 'todo', dueLabel: 'هذا الأسبوع', category: 'تعلم', recurring: true },
]

const initialGoals: Goal[] = [
  { id: 'goal-1', title: 'إطلاق النسخة الأولى من المنتج', description: 'تحويل الفكرة إلى منتج قابل للاستخدام وإثبات الحلقة اليومية.', horizon: 'quarter', status: 'active', progress: 42, targetLabel: 'قبل نهاية الربع الحالي' },
  { id: 'goal-2', title: 'بناء روتين صحي مستقر', description: 'تثبيت النوم والحركة والطاقة بدل الاعتماد على الحماس.', horizon: 'year', status: 'active', progress: 68, targetLabel: 'خلال السنة الحالية' },
]

const initialProjects: Project[] = [
  { id: 'project-1', title: 'منصة التحكم الشخصي', description: 'تنفيذ الـMVP وربط المهام والملاحظات بخطة اليوم.', goalId: 'goal-1', status: 'in-progress', progress: 55, dueLabel: 'هذا الشهر' },
  { id: 'project-2', title: 'تحضير إطلاق تجريبي', description: 'تجهيز تجربة قصيرة لعدد محدود من المستخدمين.', goalId: 'goal-1', status: 'backlog', progress: 18, dueLabel: 'الأسبوع القادم' },
  { id: 'project-3', title: 'روتين الحركة والنوم', description: 'تثبيت جلسات الحركة ومواعيد النوم في الأسبوع.', goalId: 'goal-2', status: 'in-progress', progress: 72, dueLabel: 'مستمر' },
]

const initialFinanceEntries: FinanceEntry[] = [
  { id: 'finance-1', title: 'اشتراك أدوات العمل', amount: 850, kind: 'expense', category: 'شغل', localDate: '2026-08-12', note: 'اشتراك شهري', projectId: 'project-1', goalId: 'goal-1', recurrence: 'monthly' },
  { id: 'finance-2', title: 'مشتريات البيت', amount: 1250, kind: 'expense', category: 'بيت', localDate: '2026-08-10', note: 'مستلزمات الأسبوع', recurrence: 'none' },
  { id: 'finance-3', title: 'دخل حر', amount: 5200, kind: 'income', category: 'دخل', localDate: '2026-08-05', note: 'دفعة مشروع', recurrence: 'none' },
  { id: 'finance-4', title: 'مواصلات', amount: 420, kind: 'expense', category: 'تنقل', localDate: '2026-08-03', recurrence: 'none' },
]

const initialBudget: Budget = { monthlyLimit: 12000, currency: 'جنيه' }

const initialReligious: ReligiousState = {
  city: 'القاهرة',
  calculationMethod: 'مخصص',
  prayerLogs: [
    { id: 'fajr', name: 'الفجر', time: '04:18', status: 'done', localDate: '2026-08-15' },
    { id: 'dhuhr', name: 'الظهر', time: '12:05', status: 'pending', localDate: '2026-08-15' },
    { id: 'asr', name: 'العصر', time: '15:42', status: 'pending', localDate: '2026-08-15' },
    { id: 'maghrib', name: 'المغرب', time: '18:40', status: 'pending', localDate: '2026-08-15' },
    { id: 'isha', name: 'العشاء', time: '20:05', status: 'pending', localDate: '2026-08-15' },
  ],
  prayerHistory: [
    { localDate: '2026-08-10', completed: 4, total: 5, statusCounts: { 'on-time': 3, qada: 1, pending: 1 }, missedByPrayer: {} },
    { localDate: '2026-08-11', completed: 5, total: 5, statusCounts: { 'on-time': 4, congregation: 1 }, missedByPrayer: {} },
    { localDate: '2026-08-12', completed: 3, total: 5, statusCounts: { 'on-time': 2, congregation: 1, missed: 2 }, missedByPrayer: { الفجر: 1, العصر: 1 } },
    { localDate: '2026-08-13', completed: 5, total: 5, statusCounts: { 'on-time': 3, congregation: 2 }, missedByPrayer: {} },
    { localDate: '2026-08-14', completed: 4, total: 5, statusCounts: { 'on-time': 2, qada: 2, missed: 1 }, missedByPrayer: { الظهر: 1 } },
    { localDate: '2026-08-15', completed: 1, total: 5, statusCounts: { 'on-time': 1, pending: 3, missed: 1 }, missedByPrayer: { العشاء: 1 } },
  ],
  quran: { reference: 'ورد اليوم — قراءة من موضعك المحفوظ', targetMinutes: 20, completedMinutes: 8, memorizationTarget: 10, memorizationCompleted: 4, memorizationSurahStatus: { 1: 'memorized', 112: 'memorized', 67: 'reviewing', 18: 'learning' }, playlists: [], favoriteAyahs: [], listenLater: [], listenedSurahNumbers: [] },
  dhikr: { morning: true, evening: false, morningCount: 8, eveningCount: 6, morningProgress: { 'morning-1': 2, 'morning-2': 2, 'morning-3': 2, 'morning-4': 2 }, eveningProgress: { 'evening-1': 2, 'evening-2': 2, 'evening-3': 1, 'evening-4': 1 }, tasbeehCount: 27, tasbeehTarget: 100, savedDuas: ['اللهم أعني على ذكرك وشكرك وحسن عبادتك'], sunnahChecks: { duha: false, witr: false, rawatib: false, sadaqah: false } },
}

const initialNotes: Note[] = [
  { id: 'note-1', title: 'أفكار مشروع التطبيق الجديد', body: 'لازم أراجع فكرة الاشتراكات وأشوف التسعير المناسب قبل نهاية الأسبوع.', tag: 'شغل', pinned: true, createdAt: 'منذ ساعتين' },
  { id: 'note-2', title: 'قائمة مشتريات البيت', body: 'تمر، سمبوسة، عصائر، وحاجات تانية للسحور.', tag: 'شخصي', pinned: true, createdAt: 'أمس' },
  { id: 'note-3', title: 'فكرة للمراجعة الأسبوعية', body: 'أقفل الإشعارات في أول ساعتين من يوم العمل.', tag: 'تطوير', pinned: false, createdAt: 'منذ 3 أيام' },
]

const initialHabits: Habit[] = [
  { id: 'habit-1', title: 'قراءة القرآن', icon: 'قرآن', streak: 12, doneToday: true, target: '20 دقيقة' },
  { id: 'habit-2', title: 'رياضة', icon: 'صحة', streak: 7, doneToday: true, target: '30 دقيقة', projectId: 'project-3', goalId: 'goal-2' },
  { id: 'habit-3', title: 'شرب مياه كفاية', icon: 'صحة', streak: 5, doneToday: true, target: '8 أكواب' },
  { id: 'habit-4', title: 'قراءة كتاب', icon: 'تعلم', streak: 3, doneToday: false, target: '10 صفحات' },
  { id: 'habit-5', title: 'نوم بدري', icon: 'راحة', streak: 2, doneToday: false, target: 'قبل 11:30', projectId: 'project-3', goalId: 'goal-2' },
]

const initialPlanItems: PlanItem[] = [
  { id: 'plan-1', time: '08:30', title: 'مراجعة تقرير الشغل الأسبوعي', kind: 'task', sourceId: 'task-1', status: 'done' },
  { id: 'plan-2', time: '10:00', title: 'تحضير عرض تقديمي للمشروع', kind: 'task', sourceId: 'task-3', status: 'pending' },
  { id: 'plan-3', time: '12:15', title: 'صلاة الظهر', kind: 'prayer', sourceId: 'dhuhr', status: 'pending' },
  { id: 'plan-4', time: '13:00', title: 'ورد القرآن — 20 دقيقة', kind: 'quran', sourceId: 'habit-1', status: 'pending' },
  { id: 'plan-5', time: '15:30', title: 'رياضة', kind: 'habit', sourceId: 'habit-2', status: 'pending' },
  { id: 'plan-6', time: '17:00', title: 'فترة راحة بدون شاشة', kind: 'rest', status: 'pending' },
]

const initialReminders: Reminder[] = [
  { id: 'reminder-1', title: 'إكمال تحضير العرض التقديمي', kind: 'task', dueAt: 'اليوم، ١١:٣٠', status: 'pending', sourceId: 'task-3' },
  { id: 'reminder-2', title: 'صلاة الظهر', kind: 'prayer', dueAt: 'اليوم، ١٢:١٥', status: 'pending', sourceId: 'plan-3' },
  { id: 'reminder-3', title: 'ورد القرآن — ٢٠ دقيقة', kind: 'quran', dueAt: 'اليوم، ١٣:٠٠', status: 'pending', sourceId: 'plan-4' },
  { id: 'reminder-4', title: 'مراجعة الميزانية الشهرية', kind: 'finance', dueAt: 'غدًا، ١٨:٠٠', status: 'pending', repeatLabel: 'شهريًا', },
]

const initialEntertainment: EntertainmentItem[] = [
  { id: 'entertainment-1', title: 'The Bear', type: 'series', genre: 'دراما', year: 2022, note: 'مناسب لمشاهدة حلقة قصيرة بعد يوم العمل.', status: 'watching', rating: undefined, recommend: true, downloadWanted: false, createdAt: 'منذ يومين' },
  { id: 'entertainment-2', title: 'Interstellar', type: 'movie', genre: 'خيال علمي', year: 2014, note: 'فيلم لإعادة المشاهدة في نهاية الأسبوع.', status: 'completed', rating: 5, impression: 'تجربة بصرية وتأملية ممتازة.', recommend: true, downloadWanted: false, createdAt: 'منذ أسبوع' },
  { id: 'entertainment-3', title: 'Severance', type: 'series', genre: 'غموض', year: 2022, note: 'أريد أن أبدأه عندما أفرغ من المسلسل الحالي.', status: 'want', recommend: false, downloadWanted: true, createdAt: 'اليوم' },
  { id: 'entertainment-4', title: 'Perfect Days', type: 'movie', genre: 'دراما هادئة', year: 2023, status: 'want', recommend: true, downloadWanted: false, createdAt: 'منذ 3 أيام' },
]

const initialJournal: JournalEntry[] = [
  { id: 'journal-1', localDate: '2026-08-15', title: 'بداية هادئة', body: 'أخذت وقتًا قصيرًا لأرتب أولويات اليوم وأبدأ بالخطوة الأهم.', mood: 'هادئ', createdAt: '2026-08-15T08:30:00.000Z', updatedAt: '2026-08-15T08:30:00.000Z' },
]

const STORAGE_KEY = 'personal-command-center-state-v2'
const initialWeeklyReview: WeeklyReview = { id: 'weekly-review-current', weekStart: '2026-08-10', weekEnd: '2026-08-16', wentWell: '', blockers: '', nextGoal: '', status: 'draft', updatedAt: 'لم تُحفظ بعد' }
type PersistedState = { profile: Profile; tasks: Task[]; notes: Note[]; habits: Habit[]; planItems: PlanItem[]; goals: Goal[]; projects: Project[]; financeEntries: FinanceEntry[]; budget: Budget; religious: ReligiousState; reminders: Reminder[]; entertainment: EntertainmentItem[]; journal: JournalEntry[]; weeklyReview: WeeklyReview; archive: ArchivedItem[] }

function getDefaultState(): PersistedState {
  return { profile: initialProfile, tasks: initialTasks, notes: initialNotes, habits: initialHabits, planItems: initialPlanItems, goals: initialGoals, projects: initialProjects, financeEntries: initialFinanceEntries, budget: initialBudget, religious: initialReligious, reminders: initialReminders, entertainment: initialEntertainment, journal: initialJournal, weeklyReview: initialWeeklyReview, archive: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function arrayOr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback
}

function normalizeSunnahChecks(value: unknown, fallback: Record<SunnahKey, boolean>): Record<SunnahKey, boolean> {
  const source = isRecord(value) ? value : {}
  return {
    duha: source.duha === undefined ? fallback.duha : source.duha === true,
    witr: source.witr === undefined ? fallback.witr : source.witr === true,
    rawatib: source.rawatib === undefined ? fallback.rawatib : source.rawatib === true,
    sadaqah: source.sadaqah === undefined ? fallback.sadaqah : source.sadaqah === true,
  }
}

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function calculateHabitStreak(history: Record<string, boolean>, localDate: string) {
  let streak = 0
  const base = new Date(`${localDate}T12:00:00Z`)
  while (true) {
    const date = new Date(base)
    date.setUTCDate(base.getUTCDate() - streak)
    if (!history[date.toISOString().slice(0, 10)]) break
    streak += 1
  }
  return streak
}

function progressFromCount(prefix: 'morning' | 'evening', value: unknown): Record<string, number> {
  let remaining = Math.max(0, Math.min(12, Math.round(Number(value) || 0)))
  return Object.fromEntries(Array.from({ length: 4 }, (_, index) => {
    const count = Math.min(3, remaining)
    remaining -= count
    return [`${prefix}-${index + 1}`, count]
  }))
}

function normalizeQuran(value: unknown, fallback: ReligiousState['quran']): ReligiousState['quran'] {
  const source = isRecord(value) ? value : {}
  const position = isRecord(source.lastPosition) && Number.isFinite(Number(source.lastPosition.surahNumber))
    ? { surahNumber: Math.max(1, Math.min(114, Math.round(Number(source.lastPosition.surahNumber)))), positionSeconds: Math.max(0, Math.min(86400, Math.round(Number(source.lastPosition.positionSeconds) || 0))), ...(Number.isFinite(Number(source.lastPosition.ayahNumber)) ? { ayahNumber: Math.max(1, Math.min(1000, Math.round(Number(source.lastPosition.ayahNumber)))) } : {}), ...(Number.isFinite(Number(source.lastPosition.reciterId)) ? { reciterId: Math.max(1, Math.round(Number(source.lastPosition.reciterId))) } : {}), updatedAt: typeof source.lastPosition.updatedAt === 'string' ? source.lastPosition.updatedAt.slice(0, 40) : new Date().toISOString() }
    : fallback.lastPosition
  const playlists = Array.isArray(source.playlists) ? source.playlists.slice(0, 12).flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || !Array.isArray(item.surahNumbers)) return []
    const surahNumbers = item.surahNumbers.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 30)
    return [{ id: item.id.slice(0, 80), name: item.name.trim().slice(0, 80) || 'قائمة تلاوة', surahNumbers, createdAt: typeof item.createdAt === 'string' ? item.createdAt.slice(0, 40) : new Date().toISOString() }]
  }) : fallback.playlists ?? []
  const normalizeSurahList = (value: unknown, fallbackList: number[]) => Array.isArray(value) ? value.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 114) : fallbackList
  const listenLater = normalizeSurahList(source.listenLater, fallback.listenLater ?? [])
  const listenedSurahNumbers = normalizeSurahList(source.listenedSurahNumbers, fallback.listenedSurahNumbers ?? [])
  const memorizationSurahStatus = isRecord(source.memorizationSurahStatus)
    ? Object.fromEntries(Object.entries(source.memorizationSurahStatus).flatMap(([key, status]) => { const surahNumber = Number(key); return Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114 && (status === 'memorized' || status === 'reviewing' || status === 'learning') ? [[surahNumber, status]] : [] }).slice(0, 114)) as Record<number, MemorizationSurahStatus>
    : fallback.memorizationSurahStatus ?? {}
  const favoriteAyahs = Array.isArray(source.favoriteAyahs) ? source.favoriteAyahs.slice(0, 100).flatMap((item) => {
    if (!isRecord(item)) return []
    const surahNumber = Number(item.surahNumber)
    const ayahNumber = Number(item.ayahNumber)
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > 1000) return []
    return [{ id: typeof item.id === 'string' && item.id.trim() ? item.id.slice(0, 100) : `favorite-ayah-${surahNumber}-${ayahNumber}`, surahNumber, ayahNumber, reflection: typeof item.reflection === 'string' ? item.reflection.trim().slice(0, 500) : '', createdAt: typeof item.createdAt === 'string' ? item.createdAt.slice(0, 40) : new Date().toISOString() }]
  }) : fallback.favoriteAyahs ?? []
  const targetMinutes = Math.max(5, Math.min(240, Math.round(Number(source.targetMinutes) || fallback.targetMinutes || 20)))
  const completedMinutes = Math.min(targetMinutes, Math.max(0, Number(source.completedMinutes) || fallback.completedMinutes || 0))
  return { ...fallback, ...source, targetMinutes, completedMinutes, memorizationSurahStatus, lastPosition: position, playlists, favoriteAyahs, listenLater, listenedSurahNumbers }
}

function normalizeProgress(value: unknown, fallback: Record<string, number>): Record<string, number> {
  if (!isRecord(value)) return fallback
  const entries = Object.entries(value).filter(([id, count]) => /^[a-z]+-[1-9]$/.test(id) && typeof count === 'number' && Number.isFinite(count)).slice(0, 20)
  return entries.length ? Object.fromEntries(entries.map(([id, count]) => [id, Math.max(0, Math.min(100, Math.round(count as number)))])) : fallback
}

function normalizeState(value: unknown): PersistedState | null {
  if (!isRecord(value)) return null
  const source = value.app === 'personal-command-center' && isRecord(value.data)
    ? value.data
    : value
  if (!Array.isArray(source.journal) && Array.isArray(source.journalEntries)) source.journal = source.journalEntries
  const requiredArrays = ['tasks', 'notes', 'habits', 'planItems', 'goals', 'projects', 'financeEntries', 'reminders', 'entertainment', 'journal']
  if (!isRecord(source.profile) || !isRecord(source.budget) || !isRecord(source.religious) || !isRecord(source.weeklyReview)) return null
  if (requiredArrays.some((key) => !Array.isArray(source[key]))) return null
  const profile = source.profile as Partial<Profile>
  const budget = source.budget as Partial<Budget>
  const religious = source.religious as Partial<ReligiousState>
  const weeklyReview = source.weeklyReview as Partial<WeeklyReview>
  const defaults = getDefaultState()
  return {
    profile: { ...defaults.profile, ...profile },
    tasks: arrayOr(source.tasks, defaults.tasks),
    notes: arrayOr(source.notes, defaults.notes),
    habits: arrayOr(source.habits, defaults.habits).map((habit) => ({
      ...habit,
      frequency: habit.frequency === 'weekly' ? 'weekly' : 'daily',
      history: isRecord(habit.history) ? Object.fromEntries(Object.entries(habit.history).filter(([date, done]) => /^\\d{4}-\\d{2}-\\d{2}$/.test(date) && typeof done === 'boolean').slice(-60)) : {},
    })),
    planItems: arrayOr(source.planItems, defaults.planItems).map((item) => ({ ...item, localDate: typeof item.localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.localDate) ? item.localDate : cairoToday() })),
    goals: arrayOr(source.goals, defaults.goals),
    projects: arrayOr(source.projects, defaults.projects),
    financeEntries: arrayOr(source.financeEntries, defaults.financeEntries).map((entry) => ({ ...entry, recurrence: entry.recurrence === 'weekly' || entry.recurrence === 'monthly' ? entry.recurrence : 'none' })),
    budget: { ...defaults.budget, ...budget },
    religious: {
      ...defaults.religious,
      ...religious,
      quran: normalizeQuran(religious.quran, defaults.religious.quran),
      dhikr: {
        ...defaults.religious.dhikr,
        ...(religious.dhikr ?? {}),
        morningProgress: normalizeProgress(religious.dhikr?.morningProgress, progressFromCount('morning', religious.dhikr?.morningCount)),
        eveningProgress: normalizeProgress(religious.dhikr?.eveningProgress, progressFromCount('evening', religious.dhikr?.eveningCount)),
        tasbeehCount: Math.max(0, Math.min(100000, Math.round(Number(religious.dhikr?.tasbeehCount) || defaults.religious.dhikr.tasbeehCount || 0))),
        tasbeehTarget: Math.max(1, Math.min(100000, Math.round(Number(religious.dhikr?.tasbeehTarget) || defaults.religious.dhikr.tasbeehTarget || 100))),
        savedDuas: Array.isArray(religious.dhikr?.savedDuas) ? religious.dhikr.savedDuas.filter((dua): dua is string => typeof dua === 'string' && dua.trim().length > 0).map((dua) => dua.trim().slice(0, 240)).slice(0, 20) : defaults.religious.dhikr.savedDuas,
        sunnahChecks: normalizeSunnahChecks(religious.dhikr?.sunnahChecks, defaults.religious.dhikr.sunnahChecks ?? { duha: false, witr: false, rawatib: false, sadaqah: false }),
      },
    },
    reminders: arrayOr(source.reminders, defaults.reminders),
    entertainment: arrayOr(source.entertainment, defaults.entertainment),
    journal: arrayOr(source.journal, defaults.journal),
    weeklyReview: { ...defaults.weeklyReview, ...weeklyReview },
    archive: arrayOr(source.archive, defaults.archive),
  }
}

function loadInitialState(): PersistedState {
  const defaults = getDefaultState()
  if (typeof window === 'undefined') return defaults
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return normalizeState(JSON.parse(saved)) ?? defaults
  } catch {
    // Keep the product usable if storage is unavailable or malformed.
  }
  return defaults
}

const StoreContext = createContext<CommandCenterContextValue | null>(null)

export function CommandCenterProvider({ children }: { children: React.ReactNode }) {
  const initial = loadInitialState()
  const [profile, setProfile] = useState<Profile>(initial.profile)
  const [tasks, setTasks] = useState<Task[]>(initial.tasks)
  const [notes, setNotes] = useState<Note[]>(initial.notes)
  const [habits, setHabits] = useState<Habit[]>(initial.habits)
  const [planItems, setPlanItems] = useState<PlanItem[]>(initial.planItems)
  const [goals, setGoals] = useState<Goal[]>(initial.goals)
  const [projects, setProjects] = useState<Project[]>(initial.projects)
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(initial.financeEntries)
  const [budget, setBudget] = useState<Budget>(initial.budget)
  const [religious, setReligious] = useState<ReligiousState>(initial.religious)
  const [reminders, setReminders] = useState<Reminder[]>(initial.reminders)
  const [entertainment, setEntertainment] = useState<EntertainmentItem[]>(initial.entertainment)
  const [journal, setJournal] = useState<JournalEntry[]>(initial.journal)
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview>(initial.weeklyReview ?? initialWeeklyReview)
  const [archive, setArchive] = useState<ArchivedItem[]>(initial.archive ?? [])
  const remoteHydrated = useRef(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, journal, weeklyReview, archive }))
  }, [profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, journal, weeklyReview, archive])

  useEffect(() => {
    if (remoteHydrated.current) return
    remoteHydrated.current = true
    void hydrateRemoteData().then(({ tasks: remoteTasks, notes: remoteNotes, habits: remoteHabits, planItems: remotePlanItems, goals: remoteGoals, projects: remoteProjects, financeEntries: remoteFinanceEntries, budget: remoteBudget, profile: remoteProfile, religious: remoteReligious, reminders: remoteReminders, entertainment: remoteEntertainment, journal: remoteJournal, weeklyReview: remoteWeeklyReview, archive: remoteArchive }) => {
      if (remoteTasks) setTasks(remoteTasks)
      if (remoteNotes) setNotes(remoteNotes)
      if (remoteHabits) setHabits(remoteHabits)
      if (remotePlanItems) setPlanItems(remotePlanItems)
      if (remoteGoals) setGoals(remoteGoals)
      if (remoteProjects) setProjects(remoteProjects)
      if (remoteFinanceEntries) setFinanceEntries(remoteFinanceEntries)
      if (remoteBudget) setBudget(remoteBudget)
      if (remoteProfile) setProfile(remoteProfile)
      if (remoteReligious) setReligious(remoteReligious)
      if (remoteReminders) setReminders(remoteReminders)
      if (remoteEntertainment) setEntertainment(remoteEntertainment)
      if (remoteJournal) setJournal(remoteJournal)
      if (remoteWeeklyReview) setWeeklyReview(remoteWeeklyReview)
      if (remoteArchive) setArchive(remoteArchive)
    })
  }, [])

  const addArchivedItem = (kind: ArchiveKind, payload: ArchivedPayload, subtitle: string) => {
    setArchive((items) => [{ id: payload.id, kind, title: payload.title, subtitle, archivedAt: new Date().toISOString(), payload }, ...items.filter((item) => item.id !== payload.id || item.kind !== kind)])
  }

  const value = useMemo<CommandCenterContextValue>(() => ({
    profile,
    tasks,
    exportData: () => JSON.stringify({ app: 'personal-command-center', version: 2, exportedAt: new Date().toISOString(), data: { profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, journal, weeklyReview, archive } }, null, 2),
    importData: (raw) => {
      try {
        const next = normalizeState(JSON.parse(raw))
        if (!next) return { ok: false, message: 'ملف النسخة الاحتياطية غير صالح.' }
        setProfile(next.profile)
        setTasks(next.tasks)
        setNotes(next.notes)
        setHabits(next.habits)
        setPlanItems(next.planItems)
        setGoals(next.goals)
        setProjects(next.projects)
        setFinanceEntries(next.financeEntries)
        setBudget(next.budget)
        setReligious(next.religious)
        setReminders(next.reminders)
        setEntertainment(next.entertainment)
        setJournal(next.journal)
        setWeeklyReview(next.weeklyReview)
        setArchive(next.archive)
        return { ok: true, message: 'تمت استعادة النسخة الاحتياطية محليًا.' }
      } catch {
        return { ok: false, message: 'تعذر قراءة ملف النسخة الاحتياطية.' }
      }
    },
    resetLocalData: () => {
      const defaults = getDefaultState()
      window.localStorage.removeItem(STORAGE_KEY)
      setProfile(defaults.profile)
      setTasks(defaults.tasks)
      setNotes(defaults.notes)
      setHabits(defaults.habits)
      setPlanItems(defaults.planItems)
      setGoals(defaults.goals)
      setProjects(defaults.projects)
      setFinanceEntries(defaults.financeEntries)
      setBudget(defaults.budget)
      setReligious(defaults.religious)
      setReminders(defaults.reminders)
      setEntertainment(defaults.entertainment)
      setJournal(defaults.journal)
      setWeeklyReview(defaults.weeklyReview)
      setArchive(defaults.archive)
    },
    notes,
    habits,
    planItems,
    goals,
    projects,
    financeEntries,
    budget,
    religious,
    reminders,
    entertainment,
    journal,
    weeklyReview,
    archive,
    updateProfile: (patch) => {
      setProfile((current) => ({ ...current, ...patch }))
      void updateRemoteProfile(patch)
    },
    completeOnboarding: (nextProfile) => {
      const completeProfile = { ...nextProfile, onboardingComplete: true }
      setProfile(completeProfile)
      void updateRemoteProfile(completeProfile)
    },
    toggleTask: (id) => {
      setTasks((items) => items.map((task) => {
        if (task.id !== id) return task
        const status = task.status === 'done' ? 'todo' : 'done'
        void updateRemoteTask(id, { status })
        return { ...task, status }
      }))
      setPlanItems((items) => items.map((item) => item.sourceId === id ? { ...item, status: item.status === 'done' ? 'pending' : 'done' } : item))
    },
    addTask: (input) => {
      const id = `task-${Date.now()}`
      setTasks((items) => [{ id, status: 'todo', ...input }, ...items])
      void createRemoteTask(input)
      if (input.dueLabel === 'النهاردة') {
        const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
        setPlanItems((items) => [{ id: `plan-${Date.now()}`, time, title: input.title, kind: 'task', sourceId: id, status: 'pending' }, ...items])
      }
    },
    addSubtask: (taskId, title) => {
      const cleanTitle = title.trim()
      if (!cleanTitle) return
      const subtask = { id: `subtask-${Date.now()}`, title: cleanTitle, done: false }
      setTasks((items) => items.map((task) => task.id === taskId ? { ...task, subtasks: [...(task.subtasks ?? []), subtask] } : task))
      void createRemoteSubtask(taskId, subtask)
    },
    toggleSubtask: (taskId, subtaskId) => {
      setTasks((items) => items.map((task) => {
        if (task.id !== taskId) return task
        const subtasks = (task.subtasks ?? []).map((subtask) => subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask)
        const changed = subtasks.find((subtask) => subtask.id === subtaskId)
        if (changed) void updateRemoteSubtask(taskId, subtaskId, { done: changed.done })
        return { ...task, subtasks }
      }))
    },
    removeSubtask: (taskId, subtaskId) => {
      setTasks((items) => items.map((task) => task.id === taskId ? { ...task, subtasks: (task.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId) } : task))
      void archiveRemoteSubtask(taskId, subtaskId)
    },
    updateTask: (id, patch) => {
      setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task))
      void updateRemoteTask(id, patch)
    },
    archiveTask: (id) => {
      const item = tasks.find((task) => task.id === id)
      if (!item) return
      addArchivedItem('task', item, `المهام · ${item.category}`)
      setTasks((items) => items.filter((task) => task.id !== id))
      void archiveRemoteTask(id)
    },
    addGoal: (input) => {
      const goal: Goal = { id: `goal-${Date.now()}`, title: input.title, description: input.description ?? '', horizon: input.horizon, status: input.status ?? 'active', progress: input.progress ?? 0, targetLabel: input.targetLabel }
      setGoals((items) => [goal, ...items])
      void createRemoteGoal(input)
    },
    updateGoal: (id, patch) => {
      setGoals((items) => items.map((goal) => goal.id === id ? { ...goal, ...patch } : goal))
      void updateRemoteGoal(id, patch)
    },
    archiveGoal: (id) => {
      const item = goals.find((goal) => goal.id === id)
      if (!item) return
      addArchivedItem('goal', item, `الأهداف · ${item.targetLabel}`)
      setGoals((items) => items.filter((goal) => goal.id !== id))
      setProjects((items) => items.map((project) => project.goalId === id ? { ...project, goalId: undefined } : project))
      void archiveRemoteGoal(id)
    },
    addProject: (input) => {
      const project: Project = { id: `project-${Date.now()}`, title: input.title, description: input.description ?? '', goalId: input.goalId, status: input.status ?? 'backlog', progress: input.progress ?? 0, dueLabel: input.dueLabel }
      setProjects((items) => [project, ...items])
      void createRemoteProject(input)
    },
    updateProject: (id, patch) => {
      setProjects((items) => items.map((project) => project.id === id ? { ...project, ...patch } : project))
      void updateRemoteProject(id, patch)
    },
    archiveProject: (id) => {
      const item = projects.find((project) => project.id === id)
      if (!item) return
      addArchivedItem('project', item, `المشاريع · ${item.dueLabel}`)
      setProjects((items) => items.filter((project) => project.id !== id))
      void archiveRemoteProject(id)
    },
    addFinanceEntry: (input) => {
      const entry: FinanceEntry = { id: `finance-${Date.now()}`, ...input, recurrence: input.recurrence ?? 'none', amount: Math.max(0, input.amount) }
      setFinanceEntries((items) => [entry, ...items])
      void createRemoteFinanceEntry(input)
    },
    updateFinanceEntry: (id, patch) => {
      setFinanceEntries((items) => items.map((entry) => entry.id === id ? { ...entry, ...patch, amount: patch.amount === undefined ? entry.amount : Math.max(0, patch.amount) } : entry))
      void updateRemoteFinanceEntry(id, patch)
    },
    archiveFinanceEntry: (id) => {
      const item = financeEntries.find((entry) => entry.id === id)
      if (!item) return
      addArchivedItem('finance', item, `الفلوس · ${item.category}`)
      setFinanceEntries((items) => items.filter((entry) => entry.id !== id))
      void archiveRemoteFinanceEntry(id)
    },
    updateBudget: (monthlyLimit) => {
      const safeLimit = Math.max(0, Math.round(monthlyLimit))
      setBudget((current) => ({ ...current, monthlyLimit: safeLimit }))
      void updateRemoteBudget(safeLimit)
    },
    togglePrayer: (id, requestedStatus) => {
      setReligious((current) => {
        const prayerLogs = current.prayerLogs.map((prayer) => {
          if (prayer.id !== id) return prayer
          const status = requestedStatus ?? (isPrayerCompletedStatus(prayer.status) ? 'pending' : 'done')
          return { ...prayer, status }
        })
        const localDate = prayerLogs[0]?.localDate ?? new Date().toISOString().slice(0, 10)
        const completed = prayerLogs.filter((prayer) => isPrayerCompletedStatus(prayer.status)).length
        const statusCounts = prayerLogs.reduce<Partial<Record<PrayerStatus, number>>>((counts, prayer) => {
          counts[prayer.status] = (counts[prayer.status] ?? 0) + 1
          return counts
        }, {})
        const missedByPrayer = prayerLogs.reduce<Record<string, number>>((counts, prayer) => {
          if (prayer.status === 'missed') counts[prayer.name] = (counts[prayer.name] ?? 0) + 1
          return counts
        }, {})
        const historyByDate = new Map((current.prayerHistory ?? []).map((day) => [day.localDate, day]))
        historyByDate.set(localDate, { localDate, completed, total: prayerLogs.length, statusCounts, missedByPrayer })
        const prayerHistory = Array.from(historyByDate.values()).sort((left, right) => left.localDate.localeCompare(right.localDate)).slice(-30)
        const next = { ...current, prayerLogs, prayerHistory }
        void updateRemoteReligious(next)
        return next
      })
      setPlanItems((items) => items.map((item) => item.sourceId === id ? { ...item, status: requestedStatus ? (isPrayerCompletedStatus(requestedStatus) ? 'done' : 'pending') : (item.status === 'done' ? 'pending' : 'done') } : item))
    },
    setMemorizationSurahStatus: (surahNumber, status) => {
      setReligious((current) => {
        const safeSurah = Math.max(1, Math.min(114, Math.round(surahNumber)))
        const memorizationSurahStatus = { ...(current.quran.memorizationSurahStatus ?? {}), [safeSurah]: status }
        const next = { ...current, quran: { ...current.quran, memorizationSurahStatus } }
        void updateRemoteReligious(next)
        return next
      })
    },
    setWirdTarget: (minutes) => {
      setReligious((current) => {
        const targetMinutes = Math.max(5, Math.min(240, Math.round(Number(minutes) || 20)))
        const completedMinutes = Math.min(targetMinutes, Math.max(0, current.quran.completedMinutes))
        const next = { ...current, quran: { ...current.quran, targetMinutes, completedMinutes } }
        void updateRemoteReligious(next)
        return next
      })
    },
    addMemorizationProgress: (ayahs) => {
      setReligious((current) => {
        const target = Math.max(1, current.quran.memorizationTarget ?? 10)
        const completed = Math.min(target, Math.max(0, (current.quran.memorizationCompleted ?? 0) + Math.max(0, Math.round(ayahs))))
        const next = { ...current, quran: { ...current.quran, memorizationTarget: target, memorizationCompleted: completed } }
        void updateRemoteReligious(next)
        return next
      })
    },
    saveQuranPosition: (position) => {
      setReligious((current) => {
        const next = { ...current, quran: { ...current.quran, lastPosition: { ...position, updatedAt: new Date().toISOString() } } }
        void updateRemoteReligious(next)
        return next
      })
    },
    createQuranPlaylist: (name, surahNumber) => {
      const normalizedName = name.trim().slice(0, 80)
      if (!normalizedName) return
      setReligious((current) => {
        const playlist = { id: `quran-playlist-${Date.now()}`, name: normalizedName, surahNumbers: surahNumber ? [Math.max(1, Math.min(114, Math.round(surahNumber)))] : [], createdAt: new Date().toISOString() }
        const next = { ...current, quran: { ...current.quran, playlists: [...(current.quran.playlists ?? []), playlist].slice(-12) } }
        void updateRemoteReligious(next)
        return next
      })
    },
    toggleQuranPlaylistSurah: (playlistId, surahNumber) => {
      setReligious((current) => {
        const safeSurah = Math.max(1, Math.min(114, Math.round(surahNumber)))
        const playlists = (current.quran.playlists ?? []).map((playlist) => {
          if (playlist.id !== playlistId) return playlist
          const surahNumbers = playlist.surahNumbers.includes(safeSurah) ? playlist.surahNumbers.filter((number) => number !== safeSurah) : [...playlist.surahNumbers, safeSurah].slice(0, 30)
          return { ...playlist, surahNumbers }
        })
        const next = { ...current, quran: { ...current.quran, playlists } }
        void updateRemoteReligious(next)
        return next
      })
    },
    saveQuranFavoriteAyah: (input) => {
      setReligious((current) => {
        const surahNumber = Math.max(1, Math.min(114, Math.round(Number(input.surahNumber) || 1)))
        const ayahNumber = Math.max(1, Math.min(1000, Math.round(Number(input.ayahNumber) || 1)))
        const reflection = typeof input.reflection === 'string' ? input.reflection.trim().slice(0, 500) : ''
        const existing = current.quran.favoriteAyahs ?? []
        const match = existing.find((item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber)
        const favoriteAyahs = match
          ? existing.map((item) => item.id === match.id ? { ...item, reflection } : item)
          : [...existing, { id: `favorite-ayah-${surahNumber}-${ayahNumber}-${Date.now()}`, surahNumber, ayahNumber, reflection, createdAt: new Date().toISOString() }].slice(-100)
        const next = { ...current, quran: { ...current.quran, favoriteAyahs } }
        void updateRemoteReligious(next)
        return next
      })
    },
    removeQuranFavoriteAyah: (id) => {
      setReligious((current) => {
        const favoriteAyahs = (current.quran.favoriteAyahs ?? []).filter((item) => item.id !== id)
        const next = { ...current, quran: { ...current.quran, favoriteAyahs } }
        void updateRemoteReligious(next)
        return next
      })
    },
    toggleQuranListenLater: (surahNumber) => {
      setReligious((current) => {
        const safeSurah = Math.max(1, Math.min(114, Math.round(surahNumber)))
        const currentList = current.quran.listenLater ?? []
        const listenLater = currentList.includes(safeSurah) ? currentList.filter((number) => number !== safeSurah) : [...currentList, safeSurah].slice(-114)
        const next = { ...current, quran: { ...current.quran, listenLater } }
        void updateRemoteReligious(next)
        return next
      })
    },
    toggleQuranListened: (surahNumber) => {
      setReligious((current) => {
        const safeSurah = Math.max(1, Math.min(114, Math.round(surahNumber)))
        const currentList = current.quran.listenedSurahNumbers ?? []
        const listenedSurahNumbers = currentList.includes(safeSurah) ? currentList.filter((number) => number !== safeSurah) : [...currentList, safeSurah].slice(-114)
        const next = { ...current, quran: { ...current.quran, listenedSurahNumbers } }
        void updateRemoteReligious(next)
        return next
      })
    },
    addWirdProgress: (minutes) => {
      setReligious((current) => {
        const next = { ...current, quran: { ...current.quran, completedMinutes: Math.min(current.quran.targetMinutes, current.quran.completedMinutes + Math.max(0, minutes)) } }
        void updateRemoteReligious(next)
        return next
      })
    },
    toggleDhikr: (session) => {
      setReligious((current) => {
        const nextValue = !current.dhikr[session]
        const next = { ...current, dhikr: { ...current.dhikr, [session]: nextValue, [`${session}Count`]: (current.dhikr[`${session}Count` as 'morningCount' | 'eveningCount'] ?? 0) + (nextValue ? 1 : 0), lastSession: new Date().toISOString() } }
        void updateRemoteReligious(next)
        return next
      })
    },
    incrementDhikr: (session, itemId, target = 3) => {
      setReligious((current) => {
        const progressKey = session === 'morning' ? 'morningProgress' : 'eveningProgress'
        const progress = current.dhikr[progressKey] ?? {}
        const cappedTarget = Math.max(1, Math.round(target))
        const nextProgress = { ...progress, [itemId]: Math.min(cappedTarget, (progress[itemId] ?? 0) + 1) }
        const count = Object.values(nextProgress).reduce((sum, value) => sum + value, 0)
        const next = { ...current, dhikr: { ...current.dhikr, [progressKey]: nextProgress, [`${session}Count`]: count, [session]: Object.values(nextProgress).every((value) => value >= cappedTarget), lastSession: new Date().toISOString() } }
        void updateRemoteReligious(next)
        return next
      })
    },
    addTasbeeh: (count = 1) => {
      setReligious((current) => {
        const target = Math.max(1, current.dhikr.tasbeehTarget ?? 100)
        const next = { ...current, dhikr: { ...current.dhikr, tasbeehTarget: target, tasbeehCount: Math.min(100000, Math.max(0, (current.dhikr.tasbeehCount ?? 0) + Math.max(1, Math.round(count)))) } }
        void updateRemoteReligious(next)
        return next
      })
    },
    setTasbeehTarget: (target) => {
      setReligious((current) => {
        const safeTarget = Math.min(100000, Math.max(1, Math.round(target)))
        const next = { ...current, dhikr: { ...current.dhikr, tasbeehTarget: safeTarget } }
        void updateRemoteReligious(next)
        return next
      })
    },
    resetTasbeeh: () => {
      setReligious((current) => {
        const next = { ...current, dhikr: { ...current.dhikr, tasbeehCount: 0 } }
        void updateRemoteReligious(next)
        return next
      })
    },
    addSavedDua: (text) => {
      const normalized = text.trim().slice(0, 240)
      if (!normalized) return
      setReligious((current) => {
        const savedDuas = Array.from(new Set([...(current.dhikr.savedDuas ?? []), normalized])).slice(-20)
        const next = { ...current, dhikr: { ...current.dhikr, savedDuas } }
        void updateRemoteReligious(next)
        return next
      })
    },
    removeSavedDua: (index) => {
      setReligious((current) => {
        const savedDuas = (current.dhikr.savedDuas ?? []).filter((_, itemIndex) => itemIndex !== index)
        const next = { ...current, dhikr: { ...current.dhikr, savedDuas } }
        void updateRemoteReligious(next)
        return next
      })
    },
    updateReligiousSettings: (patch) => {
      setReligious((current) => {
        const next = { ...current, ...patch }
        void updateRemoteReligious(next)
        return next
      })
    },
    updatePrayerTimes: (times) => {
      setReligious((current) => {
        const next = {
          ...current,
          prayerLogs: current.prayerLogs.map((prayer) => ({ ...prayer, time: times[prayer.name] ?? prayer.time })),
        }
        void updateRemoteReligious(next)
        return next
      })
    },
    toggleSunnah: (key) => {
      setReligious((current) => {
        const sunnahChecks = { duha: false, witr: false, rawatib: false, sadaqah: false, ...current.dhikr.sunnahChecks, [key]: !current.dhikr.sunnahChecks?.[key] }
        const next = { ...current, dhikr: { ...current.dhikr, sunnahChecks } }
        void updateRemoteReligious(next)
        return next
      })
    },
    addReminder: (input) => {
      const reminder: Reminder = { id: `reminder-${Date.now()}`, status: 'pending', ...input, repeatLabel: normalizeReminderRepeatLabel(input.repeatLabel) }
      setReminders((items) => [reminder, ...items])
      void createRemoteReminder({ ...input, repeatLabel: reminder.repeatLabel })
    },
    toggleReminder: (id) => {
      setReminders((items) => items.map((reminder) => {
        if (reminder.id !== id) return reminder
        if (reminder.status !== 'done' && reminder.repeatLabel) {
          const nextDueAt = nextReminderDueAt(reminder.repeatLabel, reminder.dueAt)
          void updateRemoteReminder(id, { status: 'pending', dueAt: nextDueAt, repeatLabel: normalizeReminderRepeatLabel(reminder.repeatLabel) })
          return { ...reminder, status: 'pending', dueAt: nextDueAt, repeatLabel: normalizeReminderRepeatLabel(reminder.repeatLabel) }
        }
        const status = reminder.status === 'done' ? 'pending' : 'done'
        void updateRemoteReminder(id, { status })
        return { ...reminder, status }
      }))
    },
    snoozeReminder: (id) => {
      setReminders((items) => items.map((reminder) => {
        if (reminder.id !== id) return reminder
        void updateRemoteReminder(id, { status: 'snoozed', dueAt: 'لاحقًا اليوم' })
        return { ...reminder, status: 'snoozed', dueAt: 'لاحقًا اليوم' }
      }))
    },
    archiveReminder: (id) => {
      const item = reminders.find((reminder) => reminder.id === id)
      if (!item) return
      addArchivedItem('reminder', item, `التذكيرات · ${item.dueAt}`)
      setReminders((items) => items.filter((reminder) => reminder.id !== id))
      void archiveRemoteReminder(id)
    },
    addEntertainment: (input) => {
      const item: EntertainmentItem = {
        id: `entertainment-${Date.now()}`,
        title: input.title,
        type: input.type,
        genre: input.genre,
        year: input.year,
        note: input.note,
        status: input.status ?? 'want',
        rating: input.rating,
        impression: input.impression,
        recommend: input.recommend ?? false,
        downloadWanted: input.downloadWanted ?? false,
        createdAt: 'الآن',
      }
      setEntertainment((items) => [item, ...items])
      void createRemoteEntertainment({ title: item.title, type: item.type, genre: item.genre, year: item.year, note: item.note, status: item.status, rating: item.rating, impression: item.impression, recommend: item.recommend, downloadWanted: item.downloadWanted })
    },
    updateEntertainment: (id, patch) => {
      setEntertainment((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
      void updateRemoteEntertainment(id, patch)
    },
    moveEntertainment: (id, status) => {
      setEntertainment((items) => items.map((item) => item.id === id ? { ...item, status } : item))
      void updateRemoteEntertainment(id, { status })
    },
    archiveEntertainment: (id) => {
      const item = entertainment.find((entry) => entry.id === id)
      if (!item) return
      addArchivedItem('entertainment', item, `الترفيه · ${item.type === 'movie' ? 'فيلم' : 'مسلسل'}`)
      setEntertainment((items) => items.filter((entry) => entry.id !== id))
      void archiveRemoteEntertainment(id)
    },
    saveJournalEntry: (input) => {
      const now = new Date().toISOString()
      const entry: JournalEntry = { id: input.id ?? `journal-${Date.now()}`, localDate: input.localDate, title: input.title.trim() || 'يومياتي', body: input.body, mood: input.mood, createdAt: now, updatedAt: now }
      setJournal((items) => {
        const existing = items.find((item) => item.localDate === entry.localDate)
        if (existing) {
          const next = { ...existing, ...entry, id: existing.id, createdAt: existing.createdAt }
          void updateRemoteJournal(existing.id, { localDate: next.localDate, title: next.title, body: next.body, mood: next.mood })
          return items.map((item) => item.id === existing.id ? next : item)
        }
        void createRemoteJournal({ id: entry.id, localDate: entry.localDate, title: entry.title, body: entry.body, mood: entry.mood })
        return [entry, ...items]
      })
    },
    updateJournalEntry: (id, patch) => {
      setJournal((items) => items.map((entry) => entry.id === id ? { ...entry, ...patch, title: patch.title === undefined ? entry.title : patch.title.trim() || 'يومياتي', updatedAt: new Date().toISOString() } : entry))
      void updateRemoteJournal(id, patch)
    },
    archiveJournalEntry: (id) => {
      const item = journal.find((entry) => entry.id === id)
      if (!item) return
      addArchivedItem('journal', item, `اليوميات · ${item.localDate}`)
      setJournal((items) => items.filter((entry) => entry.id !== id))
      void archiveRemoteJournal(id)
    },
    saveWeeklyReview: (patch) => {
      setWeeklyReview((current) => {
        const next = { ...current, ...patch, updatedAt: new Date().toLocaleString('ar-EG') }
        void updateRemoteWeeklyReview(next)
        return next
      })
    },
    addNote: (input) => {
      setNotes((items) => [{ id: `note-${Date.now()}`, pinned: false, createdAt: 'الآن', ...input }, ...items])
      void createRemoteNote(input)
    },
    toggleNotePin: (id) => {
      setNotes((items) => items.map((note) => {
        if (note.id !== id) return note
        const pinned = !note.pinned
        void updateRemoteNote(id, { pinned })
        return { ...note, pinned }
      }))
    },
    archiveNote: (id) => {
      const item = notes.find((note) => note.id === id)
      if (!item) return
      addArchivedItem('note', item, `الملاحظات · ${item.tag}`)
      setNotes((items) => items.filter((note) => note.id !== id))
      void archiveRemoteNote(id)
    },
    archiveHabit: (id) => {
      const item = habits.find((habit) => habit.id === id)
      if (!item) return
      addArchivedItem('habit', item, `العادات · ${item.target}`)
      setHabits((items) => items.filter((habit) => habit.id !== id))
      void archiveRemoteHabit(id)
    },
    archiveBoardNote: (payload) => {
      addArchivedItem('board', payload, `السبورة · ${payload.boardTitle}`)
    },
    addHabit: (input) => {
      const title = input.title.trim().slice(0, 100)
      if (!title) return
      const habit: Habit = {
        id: `habit-${Date.now()}`,
        title,
        icon: input.icon?.trim().slice(0, 24) || 'عادة',
        target: input.target.trim().slice(0, 80) || 'يوميًا',
        frequency: input.frequency === 'weekly' ? 'weekly' : 'daily',
        streak: 0,
        doneToday: false,
        history: {},
        taskId: input.taskId,
        projectId: input.projectId,
        goalId: input.goalId,
      }
      setHabits((items) => [habit, ...items])
      void createRemoteHabit({ title: habit.title, icon: habit.icon, target: habit.target, frequency: habit.frequency, taskId: habit.taskId, projectId: habit.projectId, goalId: habit.goalId })
    },
    restoreArchivedItem: (id) => {
      const item = archive.find((entry) => entry.id === id)
      if (!item) return
      setArchive((items) => items.filter((entry) => !(entry.id === id && entry.kind === item.kind)))
      switch (item.kind) {
        case 'task': setTasks((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Task, ...items]); break
        case 'note': setNotes((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Note, ...items]); break
        case 'habit': setHabits((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Habit, ...items]); break
        case 'goal': setGoals((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Goal, ...items]); break
        case 'project': setProjects((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Project, ...items]); break
        case 'finance': setFinanceEntries((items) => items.some((entry) => entry.id === id) ? items : [item.payload as FinanceEntry, ...items]); break
        case 'reminder': setReminders((items) => items.some((entry) => entry.id === id) ? items : [item.payload as Reminder, ...items]); break
        case 'entertainment': setEntertainment((items) => items.some((entry) => entry.id === id) ? items : [item.payload as EntertainmentItem, ...items]); break
        case 'journal': setJournal((items) => items.some((entry) => entry.id === id) ? items : [item.payload as JournalEntry, ...items]); break
        case 'board': {
          try {
            const queue = JSON.parse(window.localStorage.getItem('personal-command-center-board-restore-queue') ?? '[]')
            const nextQueue = Array.isArray(queue) ? [...queue.filter((entry) => entry && entry.id !== id), item.payload as BoardArchivePayload] : [item.payload as BoardArchivePayload]
            window.localStorage.setItem('personal-command-center-board-restore-queue', JSON.stringify(nextQueue))
          } catch {
            // The board can still be restored manually if local storage is unavailable.
          }
          break
        }
      }
      if (item.kind !== 'board') void restoreRemoteArchive(item.kind, id)
    },
    toggleHabit: (id) => {
      const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
      setHabits((items) => items.map((habit) => {
        if (habit.id !== id) return habit
        const doneToday = !habit.doneToday
        const history = { ...(habit.history ?? {}), [localDate]: doneToday }
        const streak = calculateHabitStreak(history, localDate)
        void toggleRemoteHabit(id, doneToday, localDate)
        return { ...habit, doneToday, history, streak }
      }))
      setPlanItems((items) => items.map((item) => item.sourceId === id ? { ...item, status: item.status === 'done' ? 'pending' : 'done' } : item))
    },
    togglePlanItem: (id) => {
      const currentItem = planItems.find((item) => item.id === id)
      if (!currentItem) return
      const status = currentItem.status === 'done' ? 'pending' : 'done'
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, status } : item))
      void updateRemotePlanItem(id, { status })
      setTasks((items) => items.map((task) => currentItem.sourceId === task.id ? { ...task, status: task.status === 'done' ? 'todo' : 'done' } : task))
    },
    updatePlanItem: (id, patch) => {
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
      void updateRemotePlanItem(id, patch)
    },
    movePlanItem: (id, localDate) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, localDate } : item))
      void updateRemotePlanItem(id, { localDate })
    },
    snoozePlanItem: (id) => {
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, status: 'snoozed' } : item))
      void updateRemotePlanItem(id, { status: 'snoozed' })
    },
    skipPlanItem: (id) => {
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, status: 'skipped' } : item))
      void updateRemotePlanItem(id, { status: 'skipped' })
    },
    restorePlanItem: (id) => {
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, status: 'pending' } : item))
      void updateRemotePlanItem(id, { status: 'pending' })
    },
  }), [profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, journal, weeklyReview, archive])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useCommandCenter() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useCommandCenter must be used within CommandCenterProvider')
  return value
}

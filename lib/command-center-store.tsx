'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { archiveRemoteFinanceEntry, archiveRemoteGoal, archiveRemoteNote, archiveRemoteProject, archiveRemoteTask, archiveRemoteReminder, createRemoteFinanceEntry, createRemoteReminder, createRemoteGoal, createRemoteNote, createRemoteProject, createRemoteTask, hydrateRemoteData, toggleRemoteHabit, updateRemoteBudget, updateRemoteFinanceEntry, updateRemoteGoal, updateRemoteNote, updateRemotePlanItem, updateRemoteProfile, updateRemoteProject, updateRemoteReligious, updateRemoteReminder, updateRemoteTask, updateRemoteWeeklyReview } from './backend-sync'

type Priority = 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in-progress' | 'done'
export type GoalStatus = 'active' | 'paused' | 'completed'
export type GoalHorizon = 'quarter' | 'year' | 'someday'
export type ProjectStatus = 'backlog' | 'in-progress' | 'done'
export type FinanceKind = 'expense' | 'income'
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

export type PrayerLog = {
  id: string
  name: string
  time: string
  status: 'pending' | 'done' | 'missed'
  localDate: string
}

export type ReligiousState = {
  city: string
  calculationMethod: string
  prayerLogs: PrayerLog[]
  quran: { reference: string; targetMinutes: number; completedMinutes: number }
  dhikr: { morning: boolean; evening: boolean; lastSession?: string }
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
}

export type PlanItem = {
  id: string
  time: string
  title: string
  kind: 'task' | 'habit' | 'prayer' | 'quran' | 'rest'
  sourceId?: string
  status: 'pending' | 'done' | 'snoozed'
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

type CommandCenterContextValue = {
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
  weeklyReview: WeeklyReview
  updateProfile: (patch: Partial<Profile>) => void
  completeOnboarding: (profile: Omit<Profile, 'onboardingComplete'>) => void
  toggleTask: (id: string) => void
  addTask: (input: Pick<Task, 'title' | 'priority' | 'dueLabel' | 'category'> & Partial<Pick<Task, 'description' | 'recurring'>>) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  archiveTask: (id: string) => void
  addGoal: (input: Pick<Goal, 'title' | 'horizon' | 'targetLabel'> & Partial<Pick<Goal, 'description' | 'status' | 'progress'>>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  archiveGoal: (id: string) => void
  addProject: (input: Pick<Project, 'title' | 'dueLabel'> & Partial<Pick<Project, 'description' | 'goalId' | 'status' | 'progress'>>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  archiveProject: (id: string) => void
  addFinanceEntry: (input: Pick<FinanceEntry, 'title' | 'amount' | 'kind' | 'category' | 'localDate'> & Partial<Pick<FinanceEntry, 'note' | 'projectId' | 'goalId'>>) => void
  updateFinanceEntry: (id: string, patch: Partial<FinanceEntry>) => void
  archiveFinanceEntry: (id: string) => void
  updateBudget: (monthlyLimit: number) => void
  togglePrayer: (id: string) => void
  addWirdProgress: (minutes: number) => void
  toggleDhikr: (session: 'morning' | 'evening') => void
  updateReligiousSettings: (patch: Pick<ReligiousState, 'city' | 'calculationMethod'>) => void
  addReminder: (input: Pick<Reminder, 'title' | 'kind' | 'dueAt'> & Partial<Pick<Reminder, 'sourceId' | 'repeatLabel'>>) => void
  toggleReminder: (id: string) => void
  snoozeReminder: (id: string) => void
  archiveReminder: (id: string) => void
  addEntertainment: (input: Pick<EntertainmentItem, 'title' | 'type' | 'genre'> & Partial<Pick<EntertainmentItem, 'year' | 'note' | 'status' | 'rating' | 'impression' | 'recommend' | 'downloadWanted'>>) => void
  updateEntertainment: (id: string, patch: Partial<EntertainmentItem>) => void
  moveEntertainment: (id: string, status: EntertainmentStatus) => void
  archiveEntertainment: (id: string) => void
  saveWeeklyReview: (patch: Pick<WeeklyReview, 'wentWell' | 'blockers' | 'nextGoal'> & Partial<Pick<WeeklyReview, 'status'>>) => void
  addNote: (input: Pick<Note, 'title' | 'body' | 'tag'>) => void
  toggleNotePin: (id: string) => void
  archiveNote: (id: string) => void
  toggleHabit: (id: string) => void
  togglePlanItem: (id: string) => void
  snoozePlanItem: (id: string) => void
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
  { id: 'finance-1', title: 'اشتراك أدوات العمل', amount: 850, kind: 'expense', category: 'شغل', localDate: '2026-08-12', note: 'اشتراك شهري', projectId: 'project-1', goalId: 'goal-1' },
  { id: 'finance-2', title: 'مشتريات البيت', amount: 1250, kind: 'expense', category: 'بيت', localDate: '2026-08-10', note: 'مستلزمات الأسبوع' },
  { id: 'finance-3', title: 'دخل حر', amount: 5200, kind: 'income', category: 'دخل', localDate: '2026-08-05', note: 'دفعة مشروع' },
  { id: 'finance-4', title: 'مواصلات', amount: 420, kind: 'expense', category: 'تنقل', localDate: '2026-08-03' },
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
  quran: { reference: 'ورد اليوم — قراءة من موضعك المحفوظ', targetMinutes: 20, completedMinutes: 8 },
  dhikr: { morning: true, evening: false },
}

const initialNotes: Note[] = [
  { id: 'note-1', title: 'أفكار مشروع التطبيق الجديد', body: 'لازم أراجع فكرة الاشتراكات وأشوف التسعير المناسب قبل نهاية الأسبوع.', tag: 'شغل', pinned: true, createdAt: 'منذ ساعتين' },
  { id: 'note-2', title: 'قائمة مشتريات البيت', body: 'تمر، سمبوسة، عصائر، وحاجات تانية للسحور.', tag: 'شخصي', pinned: true, createdAt: 'أمس' },
  { id: 'note-3', title: 'فكرة للمراجعة الأسبوعية', body: 'أقفل الإشعارات في أول ساعتين من يوم العمل.', tag: 'تطوير', pinned: false, createdAt: 'منذ 3 أيام' },
]

const initialHabits: Habit[] = [
  { id: 'habit-1', title: 'قراءة القرآن', icon: 'قرآن', streak: 12, doneToday: true, target: '20 دقيقة' },
  { id: 'habit-2', title: 'رياضة', icon: 'صحة', streak: 7, doneToday: true, target: '30 دقيقة' },
  { id: 'habit-3', title: 'شرب مياه كفاية', icon: 'صحة', streak: 5, doneToday: true, target: '8 أكواب' },
  { id: 'habit-4', title: 'قراءة كتاب', icon: 'تعلم', streak: 3, doneToday: false, target: '10 صفحات' },
  { id: 'habit-5', title: 'نوم بدري', icon: 'راحة', streak: 2, doneToday: false, target: 'قبل 11:30' },
]

const initialPlanItems: PlanItem[] = [
  { id: 'plan-1', time: '08:30', title: 'مراجعة تقرير الشغل الأسبوعي', kind: 'task', sourceId: 'task-1', status: 'done' },
  { id: 'plan-2', time: '10:00', title: 'تحضير عرض تقديمي للمشروع', kind: 'task', sourceId: 'task-3', status: 'pending' },
  { id: 'plan-3', time: '12:15', title: 'صلاة الظهر', kind: 'prayer', status: 'pending' },
  { id: 'plan-4', time: '13:00', title: 'ورد القرآن — 20 دقيقة', kind: 'quran', sourceId: 'habit-1', status: 'pending' },
  { id: 'plan-5', time: '15:30', title: 'رياضة', kind: 'habit', sourceId: 'habit-2', status: 'pending' },
  { id: 'plan-6', time: '17:00', title: 'فترة راحة بدون شاشة', kind: 'rest', status: 'pending' },
]

const initialReminders: Reminder[] = [
  { id: 'reminder-1', title: 'إكمال تحضير العرض التقديمي', kind: 'task', dueAt: 'اليوم، ١١:٣٠', status: 'pending', sourceId: 'task-3' },
  { id: 'reminder-2', title: 'صلاة الظهر', kind: 'prayer', dueAt: 'اليوم، ١٢:١٥', status: 'pending', sourceId: 'plan-3' },
  { id: 'reminder-3', title: 'ورد القرآن — ٢٠ دقيقة', kind: 'quran', dueAt: 'اليوم، ١٣:٠٠', status: 'pending', sourceId: 'plan-4' },
  { id: 'reminder-4', title: 'مراجعة الميزانية الشهرية', kind: 'finance', dueAt: 'غدًا، ١٨:٠٠', status: 'pending', repeatLabel: 'شهري' },
]

const initialEntertainment: EntertainmentItem[] = [
  { id: 'entertainment-1', title: 'The Bear', type: 'series', genre: 'دراما', year: 2022, note: 'مناسب لمشاهدة حلقة قصيرة بعد يوم العمل.', status: 'watching', rating: undefined, recommend: true, downloadWanted: false, createdAt: 'منذ يومين' },
  { id: 'entertainment-2', title: 'Interstellar', type: 'movie', genre: 'خيال علمي', year: 2014, note: 'فيلم لإعادة المشاهدة في نهاية الأسبوع.', status: 'completed', rating: 5, impression: 'تجربة بصرية وتأملية ممتازة.', recommend: true, downloadWanted: false, createdAt: 'منذ أسبوع' },
  { id: 'entertainment-3', title: 'Severance', type: 'series', genre: 'غموض', year: 2022, note: 'أريد أن أبدأه عندما أفرغ من المسلسل الحالي.', status: 'want', recommend: false, downloadWanted: true, createdAt: 'اليوم' },
  { id: 'entertainment-4', title: 'Perfect Days', type: 'movie', genre: 'دراما هادئة', year: 2023, status: 'want', recommend: true, downloadWanted: false, createdAt: 'منذ 3 أيام' },
]

const STORAGE_KEY = 'personal-command-center-state-v2'
const initialWeeklyReview: WeeklyReview = { id: 'weekly-review-current', weekStart: '2026-08-10', weekEnd: '2026-08-16', wentWell: '', blockers: '', nextGoal: '', status: 'draft', updatedAt: 'لم تُحفظ بعد' }
type PersistedState = { profile: Profile; tasks: Task[]; notes: Note[]; habits: Habit[]; planItems: PlanItem[]; goals: Goal[]; projects: Project[]; financeEntries: FinanceEntry[]; budget: Budget; religious: ReligiousState; reminders: Reminder[]; entertainment: EntertainmentItem[]; weeklyReview?: WeeklyReview }

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return { profile: initialProfile, tasks: initialTasks, notes: initialNotes, habits: initialHabits, planItems: initialPlanItems, goals: initialGoals, projects: initialProjects, financeEntries: initialFinanceEntries, budget: initialBudget, religious: initialReligious, reminders: initialReminders, entertainment: initialEntertainment, weeklyReview: initialWeeklyReview }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PersistedState>
      return { profile: { ...initialProfile, ...parsed.profile }, tasks: parsed.tasks ?? initialTasks, notes: parsed.notes ?? initialNotes, habits: parsed.habits ?? initialHabits, planItems: parsed.planItems ?? initialPlanItems, goals: parsed.goals ?? initialGoals, projects: parsed.projects ?? initialProjects, financeEntries: parsed.financeEntries ?? initialFinanceEntries, budget: parsed.budget ?? initialBudget, religious: parsed.religious ?? initialReligious, reminders: parsed.reminders ?? initialReminders, entertainment: parsed.entertainment ?? initialEntertainment, weeklyReview: parsed.weeklyReview ?? initialWeeklyReview }
    }
  } catch {
    // Keep the product usable if storage is unavailable or malformed.
  }
  return { profile: initialProfile, tasks: initialTasks, notes: initialNotes, habits: initialHabits, planItems: initialPlanItems, goals: initialGoals, projects: initialProjects, financeEntries: initialFinanceEntries, budget: initialBudget, religious: initialReligious, reminders: initialReminders, entertainment: initialEntertainment, weeklyReview: initialWeeklyReview }
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
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview>(initial.weeklyReview ?? initialWeeklyReview)
  const remoteHydrated = useRef(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, weeklyReview }))
  }, [profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, weeklyReview])

  useEffect(() => {
    if (remoteHydrated.current) return
    remoteHydrated.current = true
    void hydrateRemoteData().then(({ tasks: remoteTasks, notes: remoteNotes, habits: remoteHabits, planItems: remotePlanItems, goals: remoteGoals, projects: remoteProjects, financeEntries: remoteFinanceEntries, budget: remoteBudget, profile: remoteProfile, religious: remoteReligious, reminders: remoteReminders, weeklyReview: remoteWeeklyReview }) => {
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
      if (remoteWeeklyReview) setWeeklyReview(remoteWeeklyReview)
    })
  }, [])

  const value = useMemo<CommandCenterContextValue>(() => ({
    profile,
    tasks,
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
    weeklyReview,
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
    updateTask: (id, patch) => {
      setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task))
      void updateRemoteTask(id, patch)
    },
    archiveTask: (id) => {
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
      setProjects((items) => items.filter((project) => project.id !== id))
      void archiveRemoteProject(id)
    },
    addFinanceEntry: (input) => {
      const entry: FinanceEntry = { id: `finance-${Date.now()}`, ...input, amount: Math.max(0, input.amount) }
      setFinanceEntries((items) => [entry, ...items])
      void createRemoteFinanceEntry(input)
    },
    updateFinanceEntry: (id, patch) => {
      setFinanceEntries((items) => items.map((entry) => entry.id === id ? { ...entry, ...patch, amount: patch.amount === undefined ? entry.amount : Math.max(0, patch.amount) } : entry))
      void updateRemoteFinanceEntry(id, patch)
    },
    archiveFinanceEntry: (id) => {
      setFinanceEntries((items) => items.filter((entry) => entry.id !== id))
      void archiveRemoteFinanceEntry(id)
    },
    updateBudget: (monthlyLimit) => {
      const safeLimit = Math.max(0, Math.round(monthlyLimit))
      setBudget((current) => ({ ...current, monthlyLimit: safeLimit }))
      void updateRemoteBudget(safeLimit)
    },
    togglePrayer: (id) => {
      setReligious((current) => {
        const next = { ...current, prayerLogs: current.prayerLogs.map((prayer) => prayer.id === id ? { ...prayer, status: (prayer.status === 'done' ? 'pending' : 'done') as PrayerLog['status'] } : prayer) }
        void updateRemoteReligious(next)
        return next
      })
      setPlanItems((items) => items.map((item) => item.sourceId === id ? { ...item, status: item.status === 'done' ? 'pending' : 'done' } : item))
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
        const next = { ...current, dhikr: { ...current.dhikr, [session]: !current.dhikr[session], lastSession: new Date().toISOString() } }
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
    addReminder: (input) => {
      const reminder: Reminder = { id: `reminder-${Date.now()}`, status: 'pending', ...input }
      setReminders((items) => [reminder, ...items])
      void createRemoteReminder(input)
    },
    toggleReminder: (id) => {
      setReminders((items) => items.map((reminder) => {
        if (reminder.id !== id) return reminder
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
    },
    updateEntertainment: (id, patch) => {
      setEntertainment((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
    },
    moveEntertainment: (id, status) => {
      setEntertainment((items) => items.map((item) => item.id === id ? { ...item, status } : item))
    },
    archiveEntertainment: (id) => {
      setEntertainment((items) => items.filter((item) => item.id !== id))
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
      setNotes((items) => items.filter((note) => note.id !== id))
      void archiveRemoteNote(id)
    },
    toggleHabit: (id) => {
      setHabits((items) => items.map((habit) => {
        if (habit.id !== id) return habit
        const doneToday = !habit.doneToday
        void toggleRemoteHabit(id, doneToday)
        return { ...habit, doneToday, streak: doneToday ? habit.streak + 1 : Math.max(0, habit.streak - 1) }
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
    snoozePlanItem: (id) => {
      setPlanItems((items) => items.map((item) => item.id === id ? { ...item, status: 'snoozed' } : item))
      void updateRemotePlanItem(id, { status: 'snoozed' })
    },
  }), [profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget, religious, reminders, entertainment, weeklyReview])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useCommandCenter() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useCommandCenter must be used within CommandCenterProvider')
  return value
}

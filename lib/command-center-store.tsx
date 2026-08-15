'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { archiveRemoteFinanceEntry, archiveRemoteGoal, archiveRemoteNote, archiveRemoteProject, archiveRemoteTask, createRemoteFinanceEntry, createRemoteGoal, createRemoteNote, createRemoteProject, createRemoteTask, hydrateRemoteData, toggleRemoteHabit, updateRemoteBudget, updateRemoteFinanceEntry, updateRemoteGoal, updateRemoteNote, updateRemotePlanItem, updateRemoteProfile, updateRemoteProject, updateRemoteTask } from './backend-sync'

type Priority = 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in-progress' | 'done'
export type GoalStatus = 'active' | 'paused' | 'completed'
export type GoalHorizon = 'quarter' | 'year' | 'someday'
export type ProjectStatus = 'backlog' | 'in-progress' | 'done'
export type FinanceKind = 'expense' | 'income'

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

const STORAGE_KEY = 'personal-command-center-state-v2'
type PersistedState = { profile: Profile; tasks: Task[]; notes: Note[]; habits: Habit[]; planItems: PlanItem[]; goals: Goal[]; projects: Project[]; financeEntries: FinanceEntry[]; budget: Budget }

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return { profile: initialProfile, tasks: initialTasks, notes: initialNotes, habits: initialHabits, planItems: initialPlanItems, goals: initialGoals, projects: initialProjects, financeEntries: initialFinanceEntries, budget: initialBudget }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PersistedState>
      return { profile: { ...initialProfile, ...parsed.profile }, tasks: parsed.tasks ?? initialTasks, notes: parsed.notes ?? initialNotes, habits: parsed.habits ?? initialHabits, planItems: parsed.planItems ?? initialPlanItems, goals: parsed.goals ?? initialGoals, projects: parsed.projects ?? initialProjects, financeEntries: parsed.financeEntries ?? initialFinanceEntries, budget: parsed.budget ?? initialBudget }
    }
  } catch {
    // Keep the product usable if storage is unavailable or malformed.
  }
  return { profile: initialProfile, tasks: initialTasks, notes: initialNotes, habits: initialHabits, planItems: initialPlanItems, goals: initialGoals, projects: initialProjects, financeEntries: initialFinanceEntries, budget: initialBudget }
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
  const remoteHydrated = useRef(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget }))
  }, [profile, tasks, notes, habits, planItems, goals, projects, financeEntries, budget])

  useEffect(() => {
    if (remoteHydrated.current) return
    remoteHydrated.current = true
    void hydrateRemoteData().then(({ tasks: remoteTasks, notes: remoteNotes, habits: remoteHabits, planItems: remotePlanItems, goals: remoteGoals, projects: remoteProjects, financeEntries: remoteFinanceEntries, budget: remoteBudget, profile: remoteProfile }) => {
      if (remoteTasks) setTasks(remoteTasks)
      if (remoteNotes) setNotes(remoteNotes)
      if (remoteHabits) setHabits(remoteHabits)
      if (remotePlanItems) setPlanItems(remotePlanItems)
      if (remoteGoals) setGoals(remoteGoals)
      if (remoteProjects) setProjects(remoteProjects)
      if (remoteFinanceEntries) setFinanceEntries(remoteFinanceEntries)
      if (remoteBudget) setBudget(remoteBudget)
      if (remoteProfile) setProfile(remoteProfile)
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
  }), [profile, tasks, notes, habits, planItems, goals, projects])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useCommandCenter() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useCommandCenter must be used within CommandCenterProvider')
  return value
}

import { eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { getCurrentUser, backendUnavailable, unauthorized } from '@/server/auth/session'
import { activitySession, budget, calendarEvent, client, clientCredential, dailyPlanItem, entertainmentItem, financeEntry, goal, habit, habitLog, journalEntry, libraryResource, note, project, projectPricing, projectShare, projectUpdate, religiousSettings, reminder, secondFactorSetting, subtask, task, user, userProfile, weeklyReview, workspace, workspaceInvitation, workspaceMember } from '@/server/db/schema'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    const [accountUser] = await db.select({ id: user.id, name: user.name, email: user.email, image: user.image, createdAt: user.createdAt }).from(user).where(eq(user.id, currentUser.id)).limit(1)
    const [profile, religious, budgetRow] = await Promise.all([
      db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1),
      db.select().from(religiousSettings).where(eq(religiousSettings.userId, currentUser.id)).limit(1),
      db.select().from(budget).where(eq(budget.userId, currentUser.id)).limit(1),
    ])
    const [ownedWorkspaces, workspaceMemberships, invitations, clients, clientCredentials, calendarEvents, libraryResources, activitySessions, secondFactor, projectUpdates, projectPricingRows, projectShares, goals, projects, tasks, subtasks, notes, habits, habitLogs, planItems, reviews, financeEntries, reminders, journalEntries, entertainment] = await Promise.all([
      db.select().from(workspace).where(eq(workspace.ownerId, currentUser.id)),
      db.select().from(workspaceMember).where(eq(workspaceMember.userId, currentUser.id)),
      db.select({ id: workspaceInvitation.id, workspaceId: workspaceInvitation.workspaceId, invitedBy: workspaceInvitation.invitedBy, invitedEmail: workspaceInvitation.invitedEmail, role: workspaceInvitation.role, status: workspaceInvitation.status, expiresAt: workspaceInvitation.expiresAt, acceptedAt: workspaceInvitation.acceptedAt, createdAt: workspaceInvitation.createdAt, updatedAt: workspaceInvitation.updatedAt }).from(workspaceInvitation).where(eq(workspaceInvitation.invitedBy, currentUser.id)),
      db.select().from(client).where(eq(client.createdBy, currentUser.id)),
      db.select({ id: clientCredential.id, workspaceId: clientCredential.workspaceId, clientId: clientCredential.clientId, createdBy: clientCredential.createdBy, platform: clientCredential.platform, label: clientCredential.label, username: clientCredential.username, loginUrl: clientCredential.loginUrl, notes: clientCredential.notes, isExperimental: clientCredential.isExperimental, archivedAt: clientCredential.archivedAt, createdAt: clientCredential.createdAt, updatedAt: clientCredential.updatedAt }).from(clientCredential).where(eq(clientCredential.createdBy, currentUser.id)),
      db.select().from(calendarEvent).where(eq(calendarEvent.createdBy, currentUser.id)),
      db.select().from(libraryResource).where(eq(libraryResource.createdBy, currentUser.id)),
      db.select().from(activitySession).where(eq(activitySession.userId, currentUser.id)),
      db.select({ userId: secondFactorSetting.userId, status: secondFactorSetting.status, method: secondFactorSetting.method, isExperimental: secondFactorSetting.isExperimental, createdAt: secondFactorSetting.createdAt, updatedAt: secondFactorSetting.updatedAt }).from(secondFactorSetting).where(eq(secondFactorSetting.userId, currentUser.id)),
      db.select().from(projectUpdate).where(eq(projectUpdate.createdBy, currentUser.id)),
      db.select().from(projectPricing).where(eq(projectPricing.createdBy, currentUser.id)),
      db.select().from(projectShare).where(eq(projectShare.createdBy, currentUser.id)),
      db.select().from(goal).where(eq(goal.userId, currentUser.id)),
      db.select().from(project).where(eq(project.userId, currentUser.id)),
      db.select().from(task).where(eq(task.userId, currentUser.id)),
      db.select().from(subtask).where(eq(subtask.userId, currentUser.id)),
      db.select().from(note).where(eq(note.userId, currentUser.id)),
      db.select().from(habit).where(eq(habit.userId, currentUser.id)),
      db.select().from(habitLog).where(eq(habitLog.userId, currentUser.id)),
      db.select().from(dailyPlanItem).where(eq(dailyPlanItem.userId, currentUser.id)),
      db.select().from(weeklyReview).where(eq(weeklyReview.userId, currentUser.id)),
      db.select().from(financeEntry).where(eq(financeEntry.userId, currentUser.id)),
      db.select().from(reminder).where(eq(reminder.userId, currentUser.id)),
      db.select().from(journalEntry).where(eq(journalEntry.userId, currentUser.id)),
      db.select().from(entertainmentItem).where(eq(entertainmentItem.userId, currentUser.id)),
    ])

    return json({
      app: 'personal-command-center',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: accountUser ?? { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      data: {
        profile: profile[0] ?? null,
        religious: religious[0] ?? null,
        budget: budgetRow[0] ?? null,
        workspaces: ownedWorkspaces,
        workspaceMemberships,
        invitations,
        clients,
        clientCredentials,
        calendarEvents,
        libraryResources,
        activitySessions,
        secondFactor: secondFactor[0] ?? null,
        projectUpdates,
        projectPricing: projectPricingRows,
        projectShares,
        goals,
        projects,
        tasks,
        subtasks,
        notes,
        habits,
        habitLogs,
        planItems,
        weeklyReviews: reviews,
        financeEntries,
        reminders,
        journal: journalEntries,
        entertainment,
      },
    })
  } catch {
    return backendUnavailable()
  }
}

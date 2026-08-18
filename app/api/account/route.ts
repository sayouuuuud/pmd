import { eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { getCurrentUser, backendUnavailable, unauthorized } from '@/server/auth/session'
import { activitySession, budget, calendarEvent, client, clientCredential, dailyPlanItem, entertainmentItem, financeEntry, goal, habit, habitLog, journalEntry, libraryResource, note, project, projectPricing, projectShare, projectUpdate, religiousSettings, reminder, secondFactorSetting, subtask, task, user, userProfile, weeklyReview, workspace, workspaceInvitation, workspaceMember } from '@/server/db/schema'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    await db.transaction(async (tx) => {
      await tx.delete(clientCredential).where(eq(clientCredential.createdBy, currentUser.id))
      await tx.delete(projectShare).where(eq(projectShare.createdBy, currentUser.id))
      await tx.delete(projectPricing).where(eq(projectPricing.createdBy, currentUser.id))
      await tx.delete(projectUpdate).where(eq(projectUpdate.createdBy, currentUser.id))
      await tx.delete(libraryResource).where(eq(libraryResource.createdBy, currentUser.id))
      await tx.delete(calendarEvent).where(eq(calendarEvent.createdBy, currentUser.id))
      await tx.delete(activitySession).where(eq(activitySession.userId, currentUser.id))
      await tx.delete(secondFactorSetting).where(eq(secondFactorSetting.userId, currentUser.id))
      await tx.delete(workspaceInvitation).where(eq(workspaceInvitation.invitedBy, currentUser.id))
      await tx.delete(workspaceMember).where(eq(workspaceMember.userId, currentUser.id))
      await tx.delete(client).where(eq(client.createdBy, currentUser.id))
      await tx.delete(workspace).where(eq(workspace.ownerId, currentUser.id))
      await tx.delete(subtask).where(eq(subtask.userId, currentUser.id))
      await tx.delete(habitLog).where(eq(habitLog.userId, currentUser.id))
      await tx.delete(dailyPlanItem).where(eq(dailyPlanItem.userId, currentUser.id))
      await tx.delete(weeklyReview).where(eq(weeklyReview.userId, currentUser.id))
      await tx.delete(reminder).where(eq(reminder.userId, currentUser.id))
      await tx.delete(financeEntry).where(eq(financeEntry.userId, currentUser.id))
      await tx.delete(note).where(eq(note.userId, currentUser.id))
      await tx.delete(task).where(eq(task.userId, currentUser.id))
      await tx.delete(habit).where(eq(habit.userId, currentUser.id))
      await tx.delete(journalEntry).where(eq(journalEntry.userId, currentUser.id))
      await tx.delete(entertainmentItem).where(eq(entertainmentItem.userId, currentUser.id))
      await tx.delete(project).where(eq(project.userId, currentUser.id))
      await tx.delete(goal).where(eq(goal.userId, currentUser.id))
      await tx.delete(budget).where(eq(budget.userId, currentUser.id))
      await tx.delete(religiousSettings).where(eq(religiousSettings.userId, currentUser.id))
      await tx.delete(userProfile).where(eq(userProfile.userId, currentUser.id))
      await tx.delete(user).where(eq(user.id, currentUser.id))
    })
    return json({ ok: true, message: 'تم حذف الحساب وبياناته نهائيًا.' })
  } catch {
    return backendUnavailable()
  }
}

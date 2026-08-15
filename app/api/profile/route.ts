import { eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { user, userProfile } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const defaults = {
  city: 'القاهرة',
  dayStart: '08:00',
  workWindow: '09:00 - 17:00',
  focusGoal: 'إنجاز أهم خطوة كل يوم',
  onboardingComplete: false,
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function stringValue(value: unknown, fallback: string, maxLength = 160) {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : fallback
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    await db.insert(userProfile).values({ userId: currentUser.id, ...defaults }).onConflictDoNothing()
    const [profile] = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1)
    return json({
      user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, image: currentUser.image ?? null },
      profile: profile ?? { userId: currentUser.id, ...defaults },
    })
  } catch {
    return backendUnavailable()
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const [existing] = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1)
    const name = stringValue(body.name, currentUser.name, 80)
    const profilePatch = {
      city: stringValue(body.city, existing?.city ?? defaults.city, 80),
      dayStart: stringValue(body.dayStart, existing?.dayStart ?? defaults.dayStart, 20),
      workWindow: stringValue(body.workWindow, existing?.workWindow ?? defaults.workWindow, 40),
      focusGoal: stringValue(body.focusGoal, existing?.focusGoal ?? defaults.focusGoal, 240),
      onboardingComplete: typeof body.onboardingComplete === 'boolean' ? body.onboardingComplete : existing?.onboardingComplete ?? false,
      updatedAt: new Date(),
    }

    await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, currentUser.id))
    await db.insert(userProfile).values({ userId: currentUser.id, ...profilePatch }).onConflictDoUpdate({
      target: userProfile.userId,
      set: profilePatch,
    })
    const [profile] = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1)
    return json({
      user: { id: currentUser.id, name, email: currentUser.email, image: currentUser.image ?? null },
      profile,
    })
  } catch {
    return backendUnavailable()
  }
}

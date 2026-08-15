import { getAuth, isAuthConfigured } from '../auth'

export async function getCurrentUser(request: Request) {
  if (!isAuthConfigured()) return null
  const auth = getAuth()
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  return session?.user ?? null
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'يجب تسجيل الدخول أولاً.' }), {
    status: 401,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export function backendUnavailable() {
  return new Response(JSON.stringify({ error: 'الخادم غير مُعد بعد. أضف DATABASE_URL وBETTER_AUTH_SECRET.' }), {
    status: 503,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

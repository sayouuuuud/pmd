import { NextResponse, type NextRequest } from 'next/server'

const protectedCookieNames = ['better-auth.session_token', '__Secure-better-auth.session_token']

export function middleware(request: NextRequest) {
  const authConfigured = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET)
  if (!authConfigured) return NextResponse.next()

  const hasSession = protectedCookieNames.some((name) => request.cookies.has(name))
  if (hasSession) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}

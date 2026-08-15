import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth, isAuthConfigured } from '@/server/auth'

function unavailable() {
  return new Response(JSON.stringify({ error: 'Authentication is not configured yet.' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  })
}

export async function GET(request: Request) {
  if (!isAuthConfigured()) return unavailable()
  return toNextJsHandler(getAuth()).GET(request)
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) return unavailable()
  return toNextJsHandler(getAuth()).POST(request)
}

export async function PATCH(request: Request) {
  if (!isAuthConfigured()) return unavailable()
  return toNextJsHandler(getAuth()).PATCH(request)
}

export async function PUT(request: Request) {
  if (!isAuthConfigured()) return unavailable()
  return toNextJsHandler(getAuth()).PUT(request)
}

export async function DELETE(request: Request) {
  if (!isAuthConfigured()) return unavailable()
  return toNextJsHandler(getAuth()).DELETE(request)
}

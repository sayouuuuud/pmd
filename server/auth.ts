import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { twoFactor } from 'better-auth/plugins'
import { getDb } from './db'

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET)
}

export function getAuth() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is not configured. Add a long random secret before enabling authentication.')
  }

  return betterAuth({
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), { provider: 'pg' }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    plugins: [
      nextCookies(),
      twoFactor({
        issuer: 'Personal Command Center',
        twoFactorTable: 'twoFactor',
        twoFactorCookieMaxAge: 10 * 60,
        trustDeviceMaxAge: 30 * 24 * 60 * 60,
      }),
    ],
  })
}

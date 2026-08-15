import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { schema } from './schema'

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured. Add a Neon PostgreSQL connection string before enabling server persistence.')
  }

  return drizzle(neon(databaseUrl), { schema })
}

export type AppDb = ReturnType<typeof getDb>

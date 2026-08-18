'use client'

import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/plugins'
import { featureFlags } from '@/lib/feature-flags'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? undefined,
  plugins: featureFlags.experimental.twoFactor
    ? [twoFactorClient({ twoFactorPage: '/login?twoFactor=1' })]
    : [],
})

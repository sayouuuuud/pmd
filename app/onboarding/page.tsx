'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/ui/loading-state'

const OnboardingFlow = dynamic(
  () => import('@/components/onboarding/onboarding-flow').then((module) => module.OnboardingFlow),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center p-4 md:p-8">
        <LoadingState label="جاري تجهيز الإعداد الأولي" count={1} className="w-full" />
      </main>
    ),
  },
)

export default function OnboardingPage() {
  return <OnboardingFlow />
}

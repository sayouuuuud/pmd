import type { Metadata } from 'next'
import { RemindersWorkspace } from '@/components/reminders/reminders-workspace'

export const metadata: Metadata = {
  title: 'التذكيرات | مساحتي',
  description: 'مركز التذكيرات الهادئة لخطة يومك.',
}

export default function RemindersPage() {
  return <RemindersWorkspace />
}

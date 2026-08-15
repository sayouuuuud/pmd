import { Clapperboard } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function EntertainmentPage() {
  return (
    <PageShell
      title="الترفيه"
      description="أفلام ومسلسلات عايز تتفرج عليها، وتقييماتك بعد ما تخلص"
      icon={Clapperboard}
    />
  )
}

import { CircleAlert, LockKeyhole, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SystemState({
  kind,
  title,
  description,
  action,
}: {
  kind: 'error' | 'permission'
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  const Icon = kind === 'permission' ? LockKeyhole : CircleAlert
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} aria-live={kind === 'error' ? 'assertive' : 'polite'} className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-muted/30 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <Button type="button" variant="outline" size="sm" onClick={action.onClick}><RefreshCw data-icon="inline-start" />{action.label}</Button> : null}
    </div>
  )
}

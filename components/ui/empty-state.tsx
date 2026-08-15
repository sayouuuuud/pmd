import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        <Icon className="h-6 w-6 text-accent-foreground" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}

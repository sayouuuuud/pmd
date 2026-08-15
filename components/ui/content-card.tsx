import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ContentCard({
  children,
  className,
  title,
  description,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <section className={cn('rounded-3xl bg-card p-5 shadow-[0_8px_30px_rgba(23,23,26,0.03)]', className)}>
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

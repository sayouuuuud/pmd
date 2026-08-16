import * as React from 'react'

import { cn } from '@/lib/utils'

function Checkbox({ className, type = 'checkbox', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="checkbox"
      className={cn(
        'size-4 shrink-0 rounded border border-input bg-background accent-primary outline-none transition focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Checkbox }


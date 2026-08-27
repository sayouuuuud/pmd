'use client'

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  hideHeader = false,
  placement = 'center',
  triggerRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  hideHeader?: boolean
  placement?: 'center' | 'side'
  triggerRef?: RefObject<HTMLElement | null>
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const fallbackReturnFocusRef = useRef<HTMLElement | null>(null)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return

    fallbackReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const triggerTarget = triggerRef?.current ?? fallbackReturnFocusRef.current
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusDialog = () => {
      const dialog = dialogRef.current
      if (!dialog) return
      if (dialog.contains(document.activeElement) && document.activeElement !== document.body) return
      const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector)
      ;(firstFocusable ?? dialog).focus()
    }
    const animationFrame = window.requestAnimationFrame(focusDialog)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChangeRef.current(false)
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstFocusable = focusable[0]
      const lastFocusable = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener('keydown', handleKeyDown)
      const returnFocusTarget = triggerTarget
      if (returnFocusTarget?.isConnected) {
        window.requestAnimationFrame(() => returnFocusTarget.focus())
      }
    }
  }, [open, triggerRef])

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex overflow-y-auto bg-foreground/30 backdrop-blur-sm',
        placement === 'side' ? 'items-stretch justify-end p-0' : 'items-start justify-center p-4 pt-16',
      )}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'w-full bg-card p-4 text-card-foreground shadow-2xl sm:p-6',
          placement === 'side' ? 'min-h-dvh max-w-2xl rounded-none border-s border-border sm:rounded-s-3xl' : 'max-w-lg rounded-3xl border border-border',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        {hideHeader ? (
          <h2 id={titleId} className="sr-only">{title}</h2>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
              {description && <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="إغلاق النافذة"
              onClick={() => onOpenChange(false)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={cn(hideHeader ? '' : 'mt-5')}>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </section>
    </div>
  )
}

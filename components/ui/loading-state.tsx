export function LoadingState({
  label = 'جاري التحميل',
  count = 3,
  className = 'grid gap-4 md:grid-cols-2',
}: {
  label?: string
  count?: number
  className?: string
}) {
  return (
    <div className={className} aria-busy="true" aria-label={label} role="status">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="min-h-40 animate-pulse rounded-3xl border border-border/60 bg-muted/60" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

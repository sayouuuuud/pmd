import Link from 'next/link'

const toneClasses = {
  blue: 'bg-accent text-accent-foreground',
  green: 'bg-positive text-positive-foreground',
  purple: 'bg-accent text-accent-foreground',
  orange: 'bg-warning/20 text-warning-foreground',
} as const

type StatCardTone = keyof typeof toneClasses

export function StatCard({
  label,
  value,
  detail,
  tone = 'blue',
  href,
}: {
  label: string
  value: string
  detail: string
  tone?: StatCardTone
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${toneClasses[tone]}`}>
          {detail}
        </span>
      </div>
    </Link>
  )
}

export type QuickAddKind = 'task' | 'note' | 'finance' | 'entertainment'

export type ParsedQuickAdd = {
  kind: QuickAddKind
  title: string
  body?: string
  dueLabel?: string
  amount?: number
  financeKind?: 'expense' | 'income'
  category?: string
  recurrence?: 'none' | 'monthly' | 'weekly'
  entertainmentType?: 'movie' | 'series'
  genre?: string
}

const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
const persianDigits = '۰۱۲۳۴۵۶۷۸۹'

function normalizeDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicDigits.indexOf(digit)
    if (arabicIndex >= 0) return String(arabicIndex)
    return String(persianDigits.indexOf(digit))
  })
}

function clean(value: string) {
  return value.replace(/[،,]+/g, ' ').replace(/\s+/g, ' ').replace(/^[\s:：-]+|[\s:：-]+$/g, '').trim()
}

function extractDueLabel(value: string) {
  const normalized = normalizeDigits(value)
  const dayWord = '(?:بكرة|بكره|غدا|غدًا|غداً|النهارده|النهاردة|اليوم)'
  const hasTomorrow = new RegExp(`(?:^|\\s)(?:بكرة|بكره|غدا|غدًا|غداً)(?=$|\\s)`, 'u').test(normalized)
  const hasToday = new RegExp(`(?:^|\\s)(?:النهارده|النهاردة|اليوم)(?=$|\\s)`, 'u').test(normalized)
  const timeMatch = normalized.match(/(?:الساعة|ساعه)\s*(\d{1,2})(?:\s*[:٫.]\s*(\d{1,2}))?/u)
  const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] ?? '00').padStart(2, '0')}` : ''
  const day = hasTomorrow ? 'بكرة' : hasToday ? 'النهاردة' : ''
  const dueLabel = day || time ? [day || 'النهاردة', time].filter(Boolean).join(' · ') : 'النهاردة'
  const withoutDue = clean(value
    .replace(new RegExp(`(?:^|\\s)${dayWord}(?=$|\\s)`, 'gu'), ' ')
    .replace(/(?:الساعة|ساعه)\s*[0-9٠-٩۰-۹]{1,2}(?:\s*[:٫.]\s*[0-9٠-٩۰-۹]{1,2})?/gu, ''))
  return { dueLabel, withoutDue }
}

function categoryFor(title: string) {
  const value = title.toLowerCase()
  if (/مواصل|تاكسي|بنزين|مترو|أوبر|اوبر/u.test(value)) return 'تنقل'
  if (/أكل|اكل|مطعم|غدا|غداء|عشا|عشاء|قهوة|كافيه|كافى/u.test(value)) return 'أكل وشرب'
  if (/بيت|منزل|مشتريات|سوبر|بقالة/u.test(value)) return 'بيت'
  if (/شغل|عمل|اشتراك|أداة|اداة/u.test(value)) return 'شغل'
  return 'عام'
}

function parseAmount(value: string) {
  const normalized = normalizeDigits(value)
  const match = normalized.match(/(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?=\s|$)/u)
  if (!match) return null
  const amount = Number(match[1].replace(',', '.'))
  const sourceIndex = match.index ?? 0
  const sourceEnd = sourceIndex + match[0].length
  const originalSource = value.slice(sourceIndex, sourceEnd)
  return Number.isFinite(amount) && amount > 0 ? { amount, source: originalSource } : null
}

export function parseQuickAdd(kind: QuickAddKind, input: string): ParsedQuickAdd | null {
  const text = clean(input)
  if (!text) return null

  if (kind === 'note') {
    const [firstLine, ...rest] = input.trim().split(/\n/)
    const title = clean(firstLine)
    return title ? { kind, title, body: rest.join('\n').trim() || title } : null
  }

  if (kind === 'finance') {
    const amountData = parseAmount(text)
    if (!amountData) return null
    const financeKind = /(?:دخل|راتب|قبض|استلمت)/u.test(text) ? 'income' : 'expense'
    const recurrence = /(?:كل\s*شهر|شهري|شهريًا|شهريا)/u.test(text) ? 'monthly' : /(?:كل\s*أسبوع|أسبوعي|أسبوعيًا|اسبوعي|اسبوعيًا)/u.test(text) ? 'weekly' : 'none'
    const title = clean(text
      .replace(/(?:سجل|ضيف|أضف|اضف|مصروف|دخل|راتب|قبض|استلمت)/gu, '')
      .replace(/(?:كل\s*شهر|شهري|شهريًا|شهريا|كل\s*أسبوع|أسبوعي|أسبوعيًا|اسبوعي|اسبوعيًا)/gu, '')
      .replace(amountData.source, '')) || (financeKind === 'income' ? 'دخل' : 'مصروف')
    return { kind, title, amount: amountData.amount, financeKind, category: categoryFor(title), recurrence }
  }

  if (kind === 'entertainment') {
    const entertainmentType = /مسلسل|سلسلة|series/u.test(text) ? 'series' : 'movie'
    const title = clean(text.replace(/(?:فيلم|مسلسل|سلسلة|movie|series)/giu, ''))
    return title ? { kind, title, entertainmentType, genre: 'عام' } : null
  }

  const { dueLabel, withoutDue } = extractDueLabel(text)
  const title = clean(withoutDue.replace(/^(?:(?:ضيف|أضف|اضف|مهمة|اعمل|اعملّي)\s*)+/u, ''))
  return title ? { kind, title, dueLabel } : null
}

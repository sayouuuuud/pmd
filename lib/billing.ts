'use client'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'due' | 'paid' | 'overdue' | 'cancelled'

export type BillingLineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number
  taxPercent: number
}

export type Quote = {
  id: string
  number: string
  title: string
  projectId?: string
  clientId?: string
  currency: string
  lines: BillingLineItem[]
  status: QuoteStatus
  issueDate: string
  validUntil?: string
  notes?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export type Invoice = {
  id: string
  number: string
  title: string
  projectId?: string
  clientId?: string
  quoteId?: string
  currency: string
  lines: BillingLineItem[]
  status: InvoiceStatus
  issueDate: string
  dueDate?: string
  paidAt?: string
  financeEntryId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export type BillingTotals = {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export function calculateBillingTotals(lines: BillingLineItem[]): BillingTotals {
  return lines.reduce<BillingTotals>((totals, line) => {
    const quantity = Math.max(0, line.quantity)
    const unitPrice = Math.max(0, line.unitPrice)
    const gross = Math.round(quantity * unitPrice)
    const discount = Math.round(gross * Math.min(100, Math.max(0, line.discountPercent)) / 100)
    const taxable = Math.max(0, gross - discount)
    const tax = Math.round(taxable * Math.min(100, Math.max(0, line.taxPercent)) / 100)
    totals.subtotal += gross
    totals.discount += discount
    totals.tax += tax
    totals.total += taxable + tax
    return totals
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, fallback: string, maxLength = 240) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback
}

function cleanOptionalText(value: unknown, maxLength = 500) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined
}

export function normalizeBillingLines(value: unknown, fallback: BillingLineItem[] = []): BillingLineItem[] {
  if (!Array.isArray(value)) return fallback
  const lines = value.slice(0, 30).flatMap((item, index) => {
    if (!isRecord(item)) return []
    const description = cleanText(item.description, '', 240)
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return []
    return [{
      id: cleanText(item.id, `line-${index + 1}`, 100),
      description,
      quantity: Math.min(100000, Math.round(quantity * 100) / 100),
      unitPrice: Math.min(1000000000, Math.round(unitPrice)),
      discountPercent: Math.min(100, Math.max(0, Math.round(Number(item.discountPercent) || 0))),
      taxPercent: Math.min(100, Math.max(0, Math.round(Number(item.taxPercent) || 0))),
    }]
  })
  return lines.length ? lines : fallback
}

export function normalizeQuote(value: unknown, fallback: Quote): Quote {
  if (!isRecord(value)) return fallback
  const statuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']
  const status = statuses.includes(value.status as QuoteStatus) ? value.status as QuoteStatus : 'draft'
  const lines = normalizeBillingLines(value.lines, fallback.lines)
  const createdAt = cleanText(value.createdAt, fallback.createdAt, 40)
  return {
    id: cleanText(value.id, fallback.id, 100),
    number: cleanText(value.number, fallback.number, 60),
    title: cleanText(value.title, fallback.title, 180),
    projectId: cleanOptionalText(value.projectId, 100),
    clientId: cleanOptionalText(value.clientId, 100),
    currency: cleanText(value.currency, fallback.currency, 20),
    lines,
    status,
    issueDate: cleanText(value.issueDate, fallback.issueDate, 20),
    validUntil: cleanOptionalText(value.validUntil, 20),
    notes: cleanOptionalText(value.notes, 1000),
    createdAt,
    updatedAt: cleanText(value.updatedAt, createdAt, 40),
    archivedAt: cleanOptionalText(value.archivedAt, 40),
  }
}

export function normalizeInvoice(value: unknown, fallback: Invoice): Invoice {
  if (!isRecord(value)) return fallback
  const statuses: InvoiceStatus[] = ['draft', 'sent', 'due', 'paid', 'overdue', 'cancelled']
  const status = statuses.includes(value.status as InvoiceStatus) ? value.status as InvoiceStatus : 'draft'
  const lines = normalizeBillingLines(value.lines, fallback.lines)
  const createdAt = cleanText(value.createdAt, fallback.createdAt, 40)
  return {
    id: cleanText(value.id, fallback.id, 100),
    number: cleanText(value.number, fallback.number, 60),
    title: cleanText(value.title, fallback.title, 180),
    projectId: cleanOptionalText(value.projectId, 100),
    clientId: cleanOptionalText(value.clientId, 100),
    quoteId: cleanOptionalText(value.quoteId, 100),
    currency: cleanText(value.currency, fallback.currency, 20),
    lines,
    status,
    issueDate: cleanText(value.issueDate, fallback.issueDate, 20),
    dueDate: cleanOptionalText(value.dueDate, 20),
    paidAt: cleanOptionalText(value.paidAt, 40),
    financeEntryId: cleanOptionalText(value.financeEntryId, 100),
    notes: cleanOptionalText(value.notes, 1000),
    createdAt,
    updatedAt: cleanText(value.updatedAt, createdAt, 40),
    archivedAt: cleanOptionalText(value.archivedAt, 40),
  }
}

export function makeBillingLine(input?: Partial<BillingLineItem>): BillingLineItem {
  return {
    id: input?.id ?? `line-${Date.now()}`,
    description: input?.description ?? '',
    quantity: input?.quantity ?? 1,
    unitPrice: input?.unitPrice ?? 0,
    discountPercent: input?.discountPercent ?? 0,
    taxPercent: input?.taxPercent ?? 0,
  }
}

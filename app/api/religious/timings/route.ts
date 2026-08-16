import { NextResponse } from 'next/server'

const methods = new Set(['2', '3', '4', '5', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '99'])

function safeParam(value: string | null, fallback: string, maxLength: number) {
  const normalized = (value ?? '').trim().replace(/[\r\n]/g, '')
  return normalized.slice(0, maxLength) || fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const city = safeParam(url.searchParams.get('city'), 'Cairo', 80)
  const country = safeParam(url.searchParams.get('country'), 'Egypt', 80)
  const method = safeParam(url.searchParams.get('method'), '5', 2)
  const selectedMethod = methods.has(method) ? method : '5'
  const endpoint = new URL('https://api.aladhan.com/v1/timingsByCity')
  endpoint.searchParams.set('city', city)
  endpoint.searchParams.set('country', country)
  endpoint.searchParams.set('method', selectedMethod)

  try {
    const response = await fetch(endpoint, { next: { revalidate: 1800 } })
    if (!response.ok) {
      return NextResponse.json({ error: 'تعذر جلب مواقيت الصلاة من المصدر الخارجي.' }, { status: 502 })
    }

    const payload = await response.json() as { code?: number; data?: { timings?: Record<string, string>; date?: { readable?: string; hijri?: { date?: string } } } }
    const timings = payload.data?.timings
    if (payload.code !== 200 || !timings?.Fajr || !timings?.Dhuhr || !timings?.Asr || !timings?.Maghrib || !timings?.Isha) {
      return NextResponse.json({ error: 'المصدر الخارجي لم يُرجع مواقيت مكتملة لهذه المدينة.' }, { status: 502 })
    }

    return NextResponse.json({
      source: 'AlAdhan',
      city,
      country,
      date: payload.data?.date?.readable ?? null,
      hijriDate: payload.data?.date?.hijri?.date ?? null,
      timings: {
        الفجر: timings.Fajr,
        الظهر: timings.Dhuhr,
        العصر: timings.Asr,
        المغرب: timings.Maghrib,
        العشاء: timings.Isha,
      },
    })
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بمصدر مواقيت الصلاة حاليًا.' }, { status: 502 })
  }
}

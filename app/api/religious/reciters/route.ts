import { NextResponse } from 'next/server'

type ApiMoshaf = { id?: number; name?: string; server?: string; surah_total?: number; surah_list?: string }
type ApiReciter = { id?: number; name?: string; moshaf?: ApiMoshaf[] }

export async function GET() {
  try {
    const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar', { next: { revalidate: 86400 } })
    if (!response.ok) return NextResponse.json({ error: 'تعذر جلب كتالوج القراء من المصدر الخارجي.' }, { status: 502 })
    const payload = await response.json() as { reciters?: ApiReciter[] }
    const reciters = (payload.reciters ?? []).slice(0, 30).map((reciter) => {
      const moshaf = reciter.moshaf?.find((item) => item.server && item.surah_list) ?? reciter.moshaf?.[0]
      return {
        id: reciter.id,
        name: reciter.name,
        read: moshaf?.name,
        server: moshaf?.server,
        surahTotal: moshaf?.surah_total,
        surahList: moshaf?.surah_list,
      }
    }).filter((reciter) => reciter.id && reciter.name && reciter.server)

    return NextResponse.json({ source: 'MP3Quran', reciters })
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بكتالوج التلاوات حاليًا.' }, { status: 502 })
  }
}

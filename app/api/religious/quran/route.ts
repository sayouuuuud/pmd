import { NextResponse } from 'next/server'

function parseSurah(value: string | null) {
  if (value === null || value.trim() === '') return 1
  const surah = Number(value)
  return Number.isInteger(surah) && surah >= 1 && surah <= 114 ? surah : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const surah = parseSurah(url.searchParams.get('surah'))
  if (surah === null) return NextResponse.json({ error: 'رقم السورة يجب أن يكون بين 1 و114.' }, { status: 400 })
  const endpoint = `https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`

  try {
    const response = await fetch(endpoint, { next: { revalidate: 86400 } })
    if (!response.ok) return NextResponse.json({ error: 'تعذر جلب نص السورة من المصدر الخارجي.' }, { status: 502 })
    const payload = await response.json() as { code?: number; data?: { number?: number; name?: string; englishName?: string; numberOfAyahs?: number; ayahs?: Array<{ numberInSurah?: number; text?: string }> } }
    if (payload.code !== 200 || !payload.data?.ayahs?.length) return NextResponse.json({ error: 'لم يُرجع المصدر نص السورة المطلوب.' }, { status: 502 })

    return NextResponse.json({
      source: 'AlQuran Cloud',
      surah: {
        number: payload.data.number,
        name: payload.data.name,
        englishName: payload.data.englishName,
        numberOfAyahs: payload.data.numberOfAyahs,
      },
      ayahs: payload.data.ayahs.map((ayah) => ({ number: ayah.numberInSurah, text: ayah.text })),
    })
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بمصدر نص القرآن حاليًا.' }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'

function parseSurah(value: string | null) {
  if (value === null || value.trim() === '') return 1
  const surah = Number(value)
  return Number.isInteger(surah) && surah >= 1 && surah <= 114 ? surah : null
}

function parseJuz(value: string | null) {
  if (value === null || value.trim() === '') return null
  const juz = Number(value)
  return Number.isInteger(juz) && juz >= 1 && juz <= 30 ? juz : null
}

type QuranPayload = {
  code?: number
  data?: {
    number?: number
    name?: string
    englishName?: string
    numberOfAyahs?: number
    ayahs?: Array<{
      number?: number
      numberInSurah?: number
      text?: string
      surah?: { number?: number; name?: string }
    }>
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const juzParam = url.searchParams.get('juz')
  const surahParam = url.searchParams.get('surah')
  if (juzParam !== null && surahParam !== null) return NextResponse.json({ error: 'اختر السورة أو الجزء، وليس الاثنين معًا.' }, { status: 400 })

  const juz = parseJuz(juzParam)
  if (juzParam !== null && juz === null) return NextResponse.json({ error: 'رقم الجزء يجب أن يكون بين 1 و30.' }, { status: 400 })

  const surah = juz === null ? parseSurah(surahParam) : null
  if (juz === null && surah === null) return NextResponse.json({ error: 'رقم السورة يجب أن يكون بين 1 و114.' }, { status: 400 })

  const mode = juz === null ? 'surah' : 'juz'
  const endpoint = mode === 'juz'
    ? `https://api.alquran.cloud/v1/juz/${juz}/ar.alafasy`
    : `https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`

  try {
    const response = await fetch(endpoint, { next: { revalidate: 86400 } })
    if (!response.ok) return NextResponse.json({ error: 'تعذر جلب نص القرآن من المصدر الخارجي.' }, { status: 502 })
    const payload = await response.json() as QuranPayload
    if (payload.code !== 200 || !payload.data?.ayahs?.length) return NextResponse.json({ error: 'لم يُرجع المصدر نص القرآن المطلوب.' }, { status: 502 })

    const data = payload.data
    const ayahs = data.ayahs
    if (!ayahs?.length) return NextResponse.json({ error: 'لم يُرجع المصدر نص القرآن المطلوب.' }, { status: 502 })
    return NextResponse.json({
      source: 'AlQuran Cloud',
      mode,
      surah: mode === 'surah' ? {
        number: data.number,
        name: data.name,
        englishName: data.englishName,
        numberOfAyahs: data.numberOfAyahs,
      } : undefined,
      juz: mode === 'juz' ? {
        number: juz,
        name: data.name ?? `الجزء ${juz}`,
        englishName: data.englishName,
      } : undefined,
      ayahs: ayahs.map((ayah) => ({
        number: ayah.numberInSurah,
        text: ayah.text,
        surahNumber: mode === 'juz' ? ayah.surah?.number : data.number,
        surahName: mode === 'juz' ? ayah.surah?.name : data.name,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بمصدر نص القرآن حاليًا.' }, { status: 502 })
  }
}

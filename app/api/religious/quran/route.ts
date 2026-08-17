import { NextResponse } from 'next/server'

function parseSurah(value: string | null) {
  if (value === null || value.trim() === '') return 1
  const surah = Number(value)
  return Number.isInteger(surah) && surah >= 1 && surah <= 114 ? surah : null
}

function isCatalogRequest(value: string | null) {
  return value === 'surahs'
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

type SurahCatalogPayload = {
  code?: number
  data?: Array<{
    number?: number
    name?: string
    englishName?: string
    englishNameTranslation?: string
    numberOfAyahs?: number
    revelationType?: string
  }>
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const catalog = url.searchParams.get('catalog')
  const juzParam = url.searchParams.get('juz')
  const surahParam = url.searchParams.get('surah')
  if (catalog !== null && !isCatalogRequest(catalog)) return NextResponse.json({ error: 'نوع الفهرس غير مدعوم.' }, { status: 400 })
  if (catalog !== null && (juzParam !== null || surahParam !== null)) return NextResponse.json({ error: 'اختر الفهرس أو السورة أو الجزء، وليس أكثر من خيار.' }, { status: 400 })
  if (juzParam !== null && surahParam !== null) return NextResponse.json({ error: 'اختر السورة أو الجزء، وليس الاثنين معًا.' }, { status: 400 })

  if (isCatalogRequest(catalog)) {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah', { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) })
      if (!response.ok) return NextResponse.json({ error: 'تعذر جلب فهرس السور من المصدر الخارجي.' }, { status: 502 })
      const payload = await response.json() as SurahCatalogPayload
      const surahs = payload.data?.filter((surah) => Number.isInteger(surah.number) && Boolean(surah.name)).map((surah) => ({
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      })) ?? []
      if (payload.code !== 200 || surahs.length !== 114) return NextResponse.json({ error: 'لم يُرجع المصدر فهرس السور الكامل.' }, { status: 502 })
      return NextResponse.json({ source: 'AlQuran Cloud', catalog: 'surahs', surahs })
    } catch {
      return NextResponse.json({ error: 'تعذر الاتصال بفهرس السور حاليًا.' }, { status: 502 })
    }
  }

  const juz = parseJuz(juzParam)
  if (juzParam !== null && juz === null) return NextResponse.json({ error: 'رقم الجزء يجب أن يكون بين 1 و30.' }, { status: 400 })

  const surah = juz === null ? parseSurah(surahParam) : null
  if (juz === null && surah === null) return NextResponse.json({ error: 'رقم السورة يجب أن يكون بين 1 و114.' }, { status: 400 })

  const mode = juz === null ? 'surah' : 'juz'
  const endpoint = mode === 'juz'
    ? `https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`
    : `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`

  try {
    const response = await fetch(endpoint, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) })
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

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/app/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID gerekli' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantı hatası' },
        { status: 500 }
      )
    }

    // 1) click_count'ı açıkça seç + .single() ile tip kesinleşsin
    const { data: link, error: selErr } = await supabase
      .from('links')
      .select('id, click_count')
      .eq('id', linkId)
      .single()

    if (selErr) {
      console.error('Link getirme hatası:', selErr)
      return NextResponse.json(
        { error: 'Link bulunamadı' },
        { status: 404 }
      )
    }

    const currentCount = (link as any)?.click_count ?? 0

    // 2) Artır ve yine alanı seç (tip güvenli olsun)
    const { data: updated, error: updErr } = await (supabase as any)
      .from('links')
      .update({ click_count: currentCount + 1 })
      .eq('id', linkId)
      .select('id, click_count')
      .single()

    if (updErr) {
      console.error('Click count güncelleme hatası:', updErr)
      return NextResponse.json(
        { error: 'Tıklama sayısı güncellenemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newClickCount: (updated as any).click_count
    })

  } catch (error) {
    console.error('Click tracking hatası:', error)
    return NextResponse.json(
      { error: 'Beklenmeyen hata oluştu' },
      { status: 500 }
    )
  }
}

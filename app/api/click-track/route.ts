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

    // Önce mevcut click_count değerini al
    const { data: currentLink, error: fetchError } = await supabase
      .from('links')
      .select('click_count')
      .eq('id', linkId)
      .single()

    if (fetchError) {
      console.error('Link getirme hatası:', fetchError)
      return NextResponse.json(
        { error: 'Link bulunamadı' },
        { status: 404 }
      )
    }

    const currentCount = currentLink?.click_count || 0

    // Click count'u artır
    const { data, error } = await supabase
      .from('links')
      .update({ 
        click_count: currentCount + 1 
      })
      .eq('id', linkId)
      .select()

    if (error) {
      console.error('Click count güncelleme hatası:', error)
      return NextResponse.json(
        { error: 'Tıklama sayısı güncellenemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newClickCount: currentCount + 1
    })

  } catch (error) {
    console.error('Click tracking hatası:', error)
    return NextResponse.json(
      { error: 'Beklenmeyen hata oluştu' },
      { status: 500 }
    )
  }
}

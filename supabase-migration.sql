-- Supabase veritabanına click_count sütunu eklemek için migration
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- links tablosuna click_count sütunu ekle
ALTER TABLE public.links 
ADD COLUMN click_count INTEGER DEFAULT 0 NOT NULL;

-- Mevcut tüm kayıtların click_count değerini 0 olarak ayarla
UPDATE public.links 
SET click_count = 0 
WHERE click_count IS NULL;

-- İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_links_click_count ON public.links(click_count);

-- Açıklama ekle
COMMENT ON COLUMN public.links.click_count IS 'Link tıklama sayısını tutar';

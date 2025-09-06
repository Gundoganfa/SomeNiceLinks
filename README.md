# 🔗 SomeNice Links

Kişisel link koleksiyonum ve finansal veri takibi uygulaması.

## 🎯 Özellikler

### 🔗 Link Yönetimi
- **Drag & Drop Sıralama**: Link kutucuklarını sürükleyerek yeniden düzenleyin
- **Kategori Sistemi**: Geliştirme, Hosting, Eğitim, Araştırma, Araçlar, Kişisel
- **Import/Export**: JSON formatında link verilerinizi yedekleyin ve yükleyin
- **LocalStorage**: Verileriniz tarayıcıda kalıcı olarak saklanır

### 🎨 Renklendirme
- **Sol Renk Paleti**: 12 farklı gradient renk seçeneği
- **Drag & Drop Renklendirme**: Renkleri sürükleyip link kutucuklarına bırakın
- **Rengi Sil**: 🗑️ ikonu ile linkleri şeffaf yapın
- **Kalıcı Renkler**: Renk seçimleriniz localStorage'da saklanır

### 📊 Finansal Veri Takibi
- **Real-time Veriler**: USD/TRY, EUR/USD, Bitcoin/USD, BIST hisseleri
- **Google Sheets Entegrasyonu**: Canlı finansal veriler
- **Otomatik Yenileme**: 15 saniyede bir güncelleme
- **Kompakt Görünüm**: Bloomberg tarzı tek satır görünüm

## 🛠️ Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **HTML5 Drag & Drop API** - Sürükle-bırak işlemleri

## 🚀 Kurulum

```bash
npm install
npm run dev
```

## 🎮 Nasıl Kullanılır

### Link Ekleme
1. **"Yeni Link"** butonuna tıklayın
2. Form bilgilerini doldurun
3. İkon ve kategori seçin

### Renklendirme
1. **Sol renk paletinden** istediğiniz rengi sürükleyin
2. **Link kutucuğuna** bırakın
3. **🗑️ ikonu** ile rengi silin

### Sıralama
1. **Link kutucuğunu** sürükleyin
2. **Yeni konuma** bırakın

### Yedekleme
1. **Export** ile linklerinizi JSON dosyası olarak indirin
2. **Import** ile yedek dosyanızı yükleyin

## 📁 Proje Yapısı

```
app/
├── components/
│   ├── FinancialData.tsx    # Finansal veri bileşeni
│   ├── LinkGrid.tsx         # Link grid ve renklendirme
│   └── AddLinkModal.tsx     # Link ekleme modal'ı
├── utils/
│   ├── financialApi.ts      # Finansal API servisleri  
│   └── googleSheetsApi.ts   # Google Sheets entegrasyonu
└── api/
    └── quote/route.ts       # Yahoo Finance proxy API
```

## 🎨 Özelleştirme

### Yeni Renk Ekleme
`app/page.tsx` dosyasında renk paletine yeni gradient'ler ekleyebilirsiniz.

### Yeni Kategori Ekleme  
`app/components/AddLinkModal.tsx` ve `LinkGrid.tsx` dosyalarında kategori listelerini güncelleyin.

---

**🔥 Geliştiriciler**: [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [TypeScript](https://typescriptlang.org)
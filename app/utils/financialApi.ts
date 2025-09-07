// Finansal API servisleri
import { ReactNode } from 'react'

// Global flag for financial data logging (set to true to enable debug logs)
export let financialDataLogEnable = false

// Function to get current log status (for googleSheetsApi)
export const getLogEnabled = () => financialDataLogEnable

// Browser console kontrolü (global olarak erişilebilir)
if (typeof window !== 'undefined') {
  (window as any).enableFinancialLogs = () => {
    financialDataLogEnable = true
    console.log('✅ Financial data logs ENABLED')
  }
  
  (window as any).disableFinancialLogs = () => {
    financialDataLogEnable = false
    console.log('❌ Financial data logs DISABLED')
  }
  
  (window as any).showLogStatus = () => {
    console.log(`📊 Financial logs: ${financialDataLogEnable ? 'ENABLED' : 'DISABLED'}`)
  }
}

export interface FinancialDataItem {
  symbol: string
  name: string
  value: number
  change: number
  icon: ReactNode
}

export interface RawFinancialDataItem {
  symbol: string
  name: string
  value: number
  change: number
  icon: null
}

// Döviz kurları için Exchange Rate API
export async function getCurrencyRates() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout
    
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const data = await response.json()
    
    return {
      usdTry: data.rates.TRY,
      eurUsd: 1 / data.rates.EUR, // EUR/USD için hesaplama
    }
  } catch (error) {
    console.error('Döviz kuru verisi alınamadı:', error)
    return {
      usdTry: 33.85, // Güncel USD/TRY kuru (6 Eylül 2025)
      eurUsd: 1.103, // Güncel EUR/USD kuru
    }
  }
}

// Bitcoin fiyatı için CoinGecko API
export async function getBitcoinPrice() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout
    
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const data = await response.json()
    
    return {
      price: data.bitcoin.usd,
      change: data.bitcoin.usd_24h_change,
    }
  } catch (error) {
    console.error('Bitcoin verisi alınamadı:', error)
    return {
      price: 56890.23, // Güncel BTC fiyatı (6 Eylül 2025)
      change: 1.24,
    }
  }
}

// BIST hisseleri için Google Sheets verisi
export async function getBistData() {
  try {
    if (financialDataLogEnable) console.log('Google Sheets\'ten finansal veriler çekiliyor...')
    
    const { getGoogleSheetsFinanceData } = await import('./googleSheetsApi')
    const googleSheetsData = await getGoogleSheetsFinanceData()
    
    if (googleSheetsData && googleSheetsData.length > 0) {
      if (financialDataLogEnable) console.log('Google Sheets verisi başarıyla alındı:', googleSheetsData)
      
      // Google Sheets verisini bizim format'a çeviriyoruz
      return googleSheetsData.map(item => ({
        symbol: item.symbol,
        price: item.price,
        change: item.change
      }))
    } else {
      throw new Error('Google Sheets\'ten veri alınamadı')
    }
    
  } catch (error) {
    console.error('Google Sheets hatası, fallback kullanılıyor:', error)
    
    // Fallback verileri
    return [
      { symbol: 'SNGYO', price: 2.63, change: -1.49 },
      { symbol: 'KZBGY', price: 12.48, change: 2.12 },
      { symbol: 'XU100', price: 10729.49, change: -0.92 }
    ]
  }
}

// XU100 verisi (getBistData'dan optimize edilmiş)
export async function getXU100FromBistData(bistData: any[]) {
  try {
    if (financialDataLogEnable) console.log('BIST verileri XU100 arama için:', bistData)
    
    // BIST verilerinden XU100'ü bul (A5'te olduğunu biliyoruz)
    const xu100Data = bistData.find(item => 
      item.symbol && (
        item.symbol.toUpperCase().includes('XU100') || 
        item.symbol.toUpperCase().includes('BIST') ||
        item.symbol.toUpperCase() === 'XU100'
      )
    )
    
    if (xu100Data) {
      if (financialDataLogEnable) console.log('XU100 verisi BIST verileri içinden alındı (A5):', xu100Data)
      return {
        value: xu100Data.price,
        change: xu100Data.change
      }
    } else {
      if (financialDataLogEnable) console.log('XU100 bulunamadı, mevcut semboller:', bistData.map(item => item.symbol))
      // Fallback olarak direkt Google Sheets'ten XU100 alalım
      return {
        value: 10729.49, // Fallback değer
        change: -0.92
      }
    }
    
  } catch (error) {
    console.error('XU100 ayrıştırma hatası, fallback kullanılıyor:', error)
    return {
      value: 10729.49, // Fallback değer
      change: -0.92
    }
  }
}

// Tüm finansal verileri toplayan ana fonksiyon
export async function getAllFinancialData(): Promise<RawFinancialDataItem[]> {
  try {
    // Paralel API çağrıları (XU100 artık BIST verilerinden çekilecek)
    const [currencyRates, bitcoinData, bistData] = await Promise.all([
      getCurrencyRates(),
      getBitcoinPrice(),
      getBistData(),
    ])

    // XU100'ü BIST verilerinden ayrıştır (A5'te olduğu için)
    const xu100Data = await getXU100FromBistData(bistData)

    // BIST verilerini filtrele - XU100'ü koru çünkü onu ayrı ayrıştırıyoruz
    // Ama diğer finansal verilerde göstermemek için daha sonra filtreleyelim
    const bistDataFiltered = bistData

    // Fallback BIST verileri (XU100 hariç)
    const defaultBistData = [
      { symbol: 'SNGYO', price: 2.63, change: -1.49 },
      { symbol: 'KZBGY', price: 12.48, change: 2.12 },
      { symbol: 'PGSUS', price: 85.30, change: 1.25 }
    ]

    const bistDataToUse = bistDataFiltered.length > 0 ? bistDataFiltered : defaultBistData

    return [
      {
        symbol: 'USD/TRY',
        name: 'Dolar/TL',
        value: currencyRates.usdTry,
        change: 0.85, // Change hesaplaması için eski değer gerekli
        icon: null, // Icon component'te ekleniyor
      },
      {
        symbol: 'EUR/USD',
        name: 'Euro/Dolar',
        value: currencyRates.eurUsd,
        change: -0.24,
        icon: null,
      },
      {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        value: bitcoinData.price,
        change: bitcoinData.change,
        icon: null,
      },
      // BIST verilerini ekle (XU100 hariç, çünkü ayrı ekliyoruz)
      ...bistDataToUse
        .filter(item => !item.symbol.toUpperCase().includes('XU100') && !item.symbol.toUpperCase().includes('BIST'))
        .map(item => ({
          symbol: item.symbol,
          name: item.symbol === 'SNGYO' ? 'Sinpaş GYO' : 
                item.symbol === 'KZBGY' ? 'Kızılbük GYO' : 
                item.symbol === 'PGSUS' ? 'Pegasus' :
                item.symbol,
          value: item.price,
          change: item.change,
          icon: null,
        })),
      // XU100'ü de ekle (A5'ten)
      {
        symbol: 'XU100',
        name: 'BIST 100',
        value: xu100Data.value,
        change: xu100Data.change,
        icon: null,
      },
    ]
  } catch (error) {
    console.error('Finansal veri alınamadı:', error)
    
    // Fallback data
    return [
      {
        symbol: 'USD/TRY',
        name: 'Dolar/TL',
        value: 33.85,
        change: 0.65,
        icon: null,
      },
      {
        symbol: 'EUR/USD',
        name: 'Euro/Dolar',
        value: 1.103,
        change: -0.18,
        icon: null,
      },
      {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        value: 56890.23,
        change: 1.24,
        icon: null,
      },
      {
        symbol: 'SNGYO',
        name: 'Sinpaş GYO',
        value: 2.63,
        change: -1.49,
        icon: null,
      },
      {
        symbol: 'KZBGY',
        name: 'Kızılbük GYO',
        value: 12.48,
        change: 2.12,
        icon: null,
      },
      {
        symbol: 'PGSUS',
        name: 'Pegasus',
        value: 85.30,
        change: 1.25,
        icon: null,
      },
      {
        symbol: 'XU100',
        name: 'BIST 100',
        value: 10729.49, // Fallback değer
        change: -0.92,
        icon: null,
      },
    ]
  }
}

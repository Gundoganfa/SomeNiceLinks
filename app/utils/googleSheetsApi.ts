// Google Sheets Finance verilerini çekme
import { getLogEnabled } from './financialApi'

export interface GoogleSheetsFinanceData {
  symbol: string
  name: string
  price: number
  change: number
}

// Google Sheets'ten veri çekme fonksiyonu
export async function getGoogleSheetsFinanceData(): Promise<GoogleSheetsFinanceData[]> {
  try {
    // Google Sheets URL'sini CSV export formatına çeviriyoruz
    const sheetId = '1z54vgfBRrVSuXmu8iBzIujxfPHAIC5YQrGqyb79ORXY'
    const sheetName = 'Finance' // Finance sayfası
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
    
    if (getLogEnabled()) console.log('Google Sheets verisi çekiliyor:', csvUrl)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 saniye timeout
    
    const response = await fetch(csvUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`)
    }
    
    const csvText = await response.text()
    if (getLogEnabled()) console.log('Google Sheets CSV verisi:', csvText.substring(0, 500) + '...')
    
    // CSV'yi parse etme
    const lines = csvText.split('\n')
    const financeData: GoogleSheetsFinanceData[] = []
    
    // A2, A3, A4, A5 satırlarındaki verileri alıyoruz (CSV'de 2, 3, 4, 5. satırlar)
    // A5'te XU100 var
    for (let i = 1; i <= 4; i++) {
      if (lines[i]) {
        const columns = parseCSVLine(lines[i])
        
        // A kolonu: hisse kodu, C kolonu: hisse adı, D kolonu: fiyat, F kolonu: % değişim
        const symbol = cleanCSVValue(columns[0]) // A kolonu
        const name = cleanCSVValue(columns[2])   // C kolonu  
        const priceStr = cleanCSVValue(columns[3]) // D kolonu
        const changeStr = cleanCSVValue(columns[5]) // F kolonu
        
        if (symbol && name && priceStr && changeStr) {
          const price = parseFloat(priceStr.replace(/[^\d.,\-]/g, '').replace(',', '.'))
          const change = parseFloat(changeStr.replace(/[^\d.,\-]/g, '').replace(',', '.'))
          
          if (!isNaN(price) && !isNaN(change)) {
            financeData.push({
              symbol: symbol.toUpperCase(),
              name,
              price,
              change
            })
          }
        }
      }
    }
    
    if (getLogEnabled()) console.log('Google Sheets parse edilen veri:', financeData)
    return financeData
    
  } catch (error) {
    console.error('Google Sheets verisi alınamadı:', error)
    
    // Fallback verileri (A2, A3, A4, A5 için)
    return [
      { symbol: 'SNGYO', name: 'Sinpaş GYO', price: 2.63, change: -1.49 },
      { symbol: 'KZBGY', name: 'Kızılbük GYO', price: 12.48, change: 2.12 },
      { symbol: 'PGSUS', name: 'Pegasus', price: 85.30, change: 1.25 },
      { symbol: 'XU100', name: 'BIST 100', price: 10729.49, change: -0.92 }
    ]
  }
}

// CSV satırını parse etme (tırnak içindeki virgülleri ignore eder)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current) // Son kolonu ekle
  return result
}

// CSV değerini temizleme
function cleanCSVValue(value: string): string {
  if (!value) return ''
  return value.replace(/^"/, '').replace(/"$/, '').trim()
}

'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Euro, Bitcoin, BarChart3 } from 'lucide-react'
import { getAllFinancialData, FinancialDataItem, RawFinancialDataItem } from '../utils/financialApi'

export function FinancialData() {
  const [data, setData] = useState<FinancialDataItem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setInitialLoading(true)
    }
    
    try {
      const financialData = await getAllFinancialData()
      
      // İkonları ekliyoruz
      const dataWithIcons = financialData.map((item: RawFinancialDataItem): FinancialDataItem => ({
        ...item,
        icon: getIcon(item.symbol)
      }))
      
      setData(dataWithIcons)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Finansal veri yüklenemedi:', error)
      // Hata durumunda mevcut verileri koruyoruz
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Her 15 saniyede bir güncelle (refresh olarak)
    const interval = setInterval(() => fetchData(true), 15000)
    
    return () => clearInterval(interval)
  }, [])

  const getIcon = (symbol: string) => {
    if (symbol.includes('USD')) return <DollarSign className="w-6 h-6" />
    if (symbol.includes('EUR')) return <Euro className="w-6 h-6" />
    if (symbol.includes('BTC')) return <Bitcoin className="w-6 h-6" />
    return <BarChart3 className="w-6 h-6" />
  }

  // Sadece ilk yüklemede loading ekranı göster
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-300/20 rounded animate-pulse"></div>
        <div className="glass-effect rounded-lg p-2 animate-pulse">
          <div className="flex flex-wrap gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="text-center px-2 py-1 rounded bg-black/20">
                <div className="w-12 h-3 bg-gray-300/30 rounded mb-0.5"></div>
                <div className="w-10 h-3 bg-gray-300/30 rounded mb-0.5"></div>
                <div className="w-8 h-3 bg-gray-300/30 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh and last update */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <TrendingUp className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Yenileniyor...' : 'Yenile'}
          </button>
          {lastUpdate && (
            <span className="text-white/60 text-xs">
              Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          {refreshing && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
          Otomatik güncelleme: 15s
        </div>
      </div>

      {/* Financial data flex - Compact blocks */}
      <div className="glass-effect rounded-lg p-2">
        <div className="flex flex-wrap gap-2 justify-start">
          {data.map((item: FinancialDataItem) => (
            <div
              key={item.symbol}
              className={`text-center px-2 py-1 rounded bg-black/20 hover:bg-black/30 transition-all duration-200 min-w-0 ${
                refreshing ? 'opacity-75' : ''
              }`}
            >
              {/* Symbol */}
              <div className="text-white font-bold text-xs leading-tight whitespace-nowrap">
                {item.symbol}
              </div>
              
              {/* Value */}
              <div className="text-white font-mono text-xs leading-tight whitespace-nowrap">
                {item.symbol.includes('BTC') ? 
                  `$${(item.value / 1000).toFixed(0)}K` : 
                  item.symbol === 'XU100' ?
                    item.value.toFixed(2) :
                    item.value.toFixed(item.symbol.includes('EUR') ? 3 : 2)
                }
              </div>
              
              {/* Change */}
              <div className={`flex items-center justify-center gap-0.5 text-xs font-medium leading-tight ${
                item.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {item.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { FinancialData } from './components/FinancialData'
import { LinkGrid } from './components/LinkGrid'
import { AddLinkModal } from './components/AddLinkModal'
import { Plus, Download, Upload, RotateCcw, Github, Globe } from 'lucide-react'

interface Link {
  id: number
  title: string
  url: string
  description: string
  icon: string
  category: string
  customColor?: string
}

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [links, setLinks] = useState<Link[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedColor, setDraggedColor] = useState<string | null>(null)
  
  const defaultLinks: Link[] = [
    {
      id: 1,
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Kod geliştirme platformu',
      icon: 'github',
      category: 'Geliştirme'
    },
    {
      id: 2,
      title: 'Vercel',
      url: 'https://vercel.com',
      description: 'Frontend deployment',
      icon: 'globe',
      category: 'Hosting'
    },
    {
      id: 3,
      title: 'Eğitici Oyunlar',
      url: 'https://egiticioyunlar.vercel.app/',
      description: 'Eğlenirken öğrenin',
      icon: 'code',
      category: 'Eğitim'
    },
    {
      id: 4,
      title: 'Ali Türkşen Hakkında',
      url: 'https://ali-turksen.vercel.app/',
      description: 'Biraz araştırın',
      icon: 'globe',
      category: 'Araştırma'
    },
    {
      id: 5,
      title: 'Tarih Unutmaz',
      url: 'https://akp-sigma.vercel.app/',
      description: 'Unutamadık',
      icon: 'database',
      category: 'Araştırma'
    },
    {
      id: 6,
      title: 'Havayolu Değerleme',
      url: 'https://havayolu-degerleme.vercel.app/',
      description: 'deneme bir model',
      icon: 'cpu',
      category: 'Araçlar'
    },
    {
      id: 7,
      title: 'Geo Downloader',
      url: 'https://geodownloader.com/',
      description: 'Coğrafi veri indirme aracı',
      icon: 'globe',
      category: 'Araçlar'
    }
  ]

  // localStorage'a kaydetme fonksiyonu
  const saveToLocalStorage = (newLinks: Link[]) => {
    try {
      localStorage.setItem('someNiceLinks', JSON.stringify(newLinks))
    } catch (error) {
      console.error('localStorage yazma hatası:', error)
    }
  }

  // localStorage'dan veri yükleme
  useEffect(() => {
    try {
      const savedLinks = localStorage.getItem('someNiceLinks')
      if (savedLinks) {
        const existingLinks: Link[] = JSON.parse(savedLinks)
        
        // localStorage'da veri varsa onu kullan, default kontrolü yapma
        setLinks(existingLinks)
      } else {
        // İlk kez açılıyorsa varsayılan linkler
        setLinks(defaultLinks)
        localStorage.setItem('someNiceLinks', JSON.stringify(defaultLinks))
      }
    } catch (error) {
      console.error('localStorage okuma hatası:', error)
      setLinks(defaultLinks)
    }
  }, [])

  const addLink = (newLink: Omit<Link, 'id'>) => {
    const newLinks = [...links, { ...newLink, id: Date.now() }]
    setLinks(newLinks)
    saveToLocalStorage(newLinks)
    setShowAddModal(false)
  }

  const deleteLink = (id: number) => {
    const newLinks = links.filter((link: Link) => link.id !== id)
    setLinks(newLinks)
    saveToLocalStorage(newLinks)
  }

  const reorderLinks = (dragIndex: number, hoverIndex: number) => {
    const newLinks = [...links]
    const [draggedItem] = newLinks.splice(dragIndex, 1)
    newLinks.splice(hoverIndex, 0, draggedItem)
    setLinks(newLinks)
    saveToLocalStorage(newLinks)
  }

  const changeColor = (id: number, color: string) => {
    const newLinks = links.map((link: Link) => {
      if (link.id === id) {
        const updatedLink = { ...link }
        if (color === '') {
          // Rengi sil - customColor field'ını tamamen kaldır
          delete updatedLink.customColor
        } else {
          updatedLink.customColor = color
        }
        return updatedLink
      }
      return link
    })
    
    setLinks(newLinks)
    saveToLocalStorage(newLinks)
  }

  // Export fonksiyonu
  const exportLinks = () => {
    try {
      const dataStr = JSON.stringify(links, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `somenice-links-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export hatası:', error)
      alert('Export işlemi başarısız!')
    }
  }

  // Import fonksiyonu
  const importLinks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        if (Array.isArray(jsonData)) {
          // ID'leri yeniden oluştur (çakışmayı önlemek için)
          const importedLinks: Link[] = jsonData.map((link: any) => ({
            ...link,
            id: Date.now() + Math.random()
          }))
          setLinks(importedLinks)
          saveToLocalStorage(importedLinks)
          alert(`${importedLinks.length} adet link başarıyla yüklendi!`)
        } else {
          alert('Geçersiz dosya formatı!')
        }
      } catch (error) {
        console.error('Import hatası:', error)
        alert('Dosya okunamadı!')
      }
    }
    reader.readAsText(file)
    
    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Varsayılan linkleri yükle (mevcut linkleri sil)
  const loadDefaults = () => {
    if (confirm('Bu işlem mevcut tüm linkleri silip varsayılan linkleri yükleyecek. Emin misiniz?')) {
      setLinks(defaultLinks)
      saveToLocalStorage(defaultLinks)
      alert(`${defaultLinks.length} adet varsayılan link yüklendi!`)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              SomeNice Links
            </h1>
            <div className="flex items-center gap-3">
              {/* Export/Import/Reset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportLinks}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  title="Linkleri Export Et"
                >
                  <Download size={16} />
                  Export
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  title="Link Dosyası Yükle"
                >
                  <Upload size={16} />
                  Import
                </button>
                
                <button
                  onClick={loadDefaults}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  title="Varsayılan Linkleri Yükle (Mevcut Linkleri Siler)"
                >
                  <RotateCcw size={16} />
                  Varsayılanlar
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importLinks}
                  className="hidden"
                />
              </div>
              
              {/* Add Link Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <Plus size={20} />
                Yeni Link
              </button>
            </div>
          </div>
        </header>

        {/* Financial Data Section */}
        <section className="mb-6">
          <FinancialData />
        </section>

        {/* Links Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Link Koleksiyonum
          </h2>
          <div className="flex gap-6">
            {/* Color Palette - Sol taraf */}
            <div className="flex-shrink-0 w-16">
              <div className="sticky top-6">
                <h3 className="text-white/60 text-xs mb-3 text-center">Renkler</h3>
                <div className="flex flex-col gap-2">
                  {[
                    'from-red-500 to-pink-600',
                    'from-orange-500 to-yellow-600', 
                    'from-green-500 to-teal-600',
                    'from-blue-500 to-purple-600',
                    'from-purple-500 to-indigo-600',
                    'from-pink-500 to-rose-600',
                    'from-cyan-500 to-blue-600',
                    'from-yellow-500 to-orange-600',
                    'from-indigo-500 to-blue-600',
                    'from-violet-500 to-purple-600',
                    'from-emerald-500 to-green-600',
                    'from-slate-500 to-gray-600'
                  ].map((color, index) => (
                    <div
                      key={index}
                      className={`w-12 h-8 rounded-lg bg-gradient-to-br ${color} cursor-grab active:cursor-grabbing hover:scale-110 transition-transform border border-white/20 shadow-lg`}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedColor(color)
                        e.dataTransfer.setData('text/plain', `color:${color}`)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => {
                        setDraggedColor(null)
                      }}
                      title="Rengi sürükleyip linke bırakın"
                    />
                  ))}
                  {/* Rengi Sil */}
                  <div
                    className="w-12 h-8 rounded-lg border-2 border-dashed border-red-400/60 hover:border-red-400 cursor-grab active:cursor-grabbing hover:scale-110 transition-all flex items-center justify-center bg-red-500/10 hover:bg-red-500/20"
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedColor('default')
                      e.dataTransfer.setData('text/plain', 'color:default')
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onDragEnd={() => {
                      setDraggedColor(null)
                    }}
                    title="Rengi sil - Varsayılan renge dön"
                  >
                    <span className="text-red-400 text-xs">🗑️</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Links Grid - Sağ taraf */}
            <div className="flex-1">
              <LinkGrid 
                links={links} 
                onDelete={deleteLink} 
                onReorder={reorderLinks} 
                onColorChange={changeColor}
                draggedColor={draggedColor}
              />
            </div>
          </div>
        </section>

        {/* Add Link Modal */}
        {showAddModal && (
          <AddLinkModal
            onAdd={addLink}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  )
}

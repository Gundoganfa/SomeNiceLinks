'use client'
import { useState } from 'react'
import { ExternalLink, Trash2, Github, Globe, Database, Server, Cpu, Code } from 'lucide-react'

interface Link {
  id: number
  title: string
  url: string
  description: string
  icon: string
  category: string
  customColor?: string
}

interface LinkGridProps {
  links: Link[]
  onDelete: (id: number) => void
  onReorder: (dragIndex: number, hoverIndex: number) => void
  onColorChange: (id: number, color: string) => void
  draggedColor: string | null
}

const getIcon = (iconName: string) => {
  const icons = {
    github: <Github className="w-6 h-6" />,
    globe: <Globe className="w-6 h-6" />,
    database: <Database className="w-6 h-6" />,
    server: <Server className="w-6 h-6" />,
    cpu: <Cpu className="w-6 h-6" />,
    code: <Code className="w-6 h-6" />,
  }
  return icons[iconName as keyof typeof icons] || <Globe className="w-6 h-6" />
}

const getCategoryColor = (category: string, customColor?: string) => {
  if (customColor) {
    return customColor
  }
  
  // CustomColor yoksa transparent döndür
  return 'transparent'
}

// Tailwind class'ını CSS gradient'e çevir
const convertTailwindToCSS = (tailwindClass: string): string => {
  // Şeffaf renk için
  if (tailwindClass === 'transparent') {
    return 'transparent'
  }

  const colorMap: Record<string, string> = {
    'red-500': '#ef4444',
    'pink-600': '#db2777',
    'orange-500': '#f97316',
    'orange-600': '#ea580c',
    'yellow-500': '#eab308',
    'yellow-600': '#ca8a04',
    'green-500': '#22c55e',
    'teal-600': '#0d9488',
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'violet-500': '#8b5cf6',
    'violet-600': '#7c3aed',
    'cyan-500': '#06b6d4',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'slate-500': '#64748b',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'rose-600': '#e11d48'
  }

  // "from-red-500 to-pink-600" format'ını parse et
  const match = tailwindClass.match(/from-(\w+-\d+) to-(\w+-\d+)/)
  if (match) {
    const fromColor = colorMap[match[1]] || '#6b7280'
    const toColor = colorMap[match[2]] || '#4b5563'
    return `linear-gradient(to bottom right, ${fromColor}, ${toColor})`
  }
  
  return 'transparent' // fallback olarak transparent
}

export function LinkGrid({ links, onDelete, onReorder, onColorChange, draggedColor }: LinkGridProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const [colorDropTarget, setColorDropTarget] = useState<number | null>(null)

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    // Drop işlemi varsa linki açma
    if (colorDropTarget !== null || draggedItem !== null) {
      e.preventDefault()
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Link reordering drag & drop handlers
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `link:${index}`)
  }

  const handleLinkDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    // text/plain formatında veri var mı kontrol et
    const hasText = e.dataTransfer.types.includes('text/plain')
    
// Debug: console.log('DragOver - hasText:', hasText, 'draggedColor:', draggedColor)
    
    if (hasText || draggedColor) {
      // DataTransfer veya global state'den renk drag'ı tespit edildi
      if (draggedColor) {
        e.dataTransfer.dropEffect = 'copy'
        setColorDropTarget(index)
// Debug: console.log('Color drop target set via fallback for index:', index)
      } else {
        // DataTransfer - renk mi link mi bilemiyoruz, her ikisini de set edelim
        setColorDropTarget(index)
        setDragOverItem(index)
// Debug: console.log('Drop targets set for index:', index)
      }
    }
  }

  const handleLinkDragLeave = (e: React.DragEvent) => {
    // Sadece gerçekten element dışına çıkıldığında temizle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const isOutside = e.clientX < rect.left || e.clientX > rect.right || 
                     e.clientY < rect.top || e.clientY > rect.bottom
    
    if (isOutside) {
      setColorDropTarget(null)
      setDragOverItem(null)
    }
  }

  const handleLinkDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
    setColorDropTarget(null)
  }

  const handleLinkDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    // text/plain formatından veri al
    const droppedData = e.dataTransfer.getData('text/plain')
    
    // Renk bırakma işlemi - DataTransfer veya fallback kullan
    let colorToApply: string | null = null
    
    // Önce DataTransfer'dan almaya çalış
    if (droppedData && droppedData.startsWith('color:')) {
      colorToApply = droppedData.replace('color:', '')
    }
    // Eğer DataTransfer çalışmadıysa, global state'i kullan
    else if (draggedColor) {
      colorToApply = draggedColor
    }
    
    if (colorToApply) {
      const link = links[dropIndex]
      
      if (colorToApply === 'default') {
        onColorChange(link.id, '')
      } else {
        onColorChange(link.id, colorToApply)
      }
      setColorDropTarget(null)
      return
    }
    
    // Link yeniden sıralama işlemi - link: prefix'i kontrol et
    if (droppedData && droppedData.startsWith('link:')) {
      const draggedIndex = parseInt(droppedData.replace('link:', ''))
      if (!isNaN(draggedIndex) && draggedIndex !== dropIndex) {
        onReorder(draggedIndex, dropIndex)
      }
    }
    
    setDraggedItem(null)
    setDragOverItem(null)
    setColorDropTarget(null)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {links.map((link, index) => (
        <div
          key={link.id}
          className={`relative group ${
            draggedItem === index ? 'opacity-50' : ''
          } ${
            dragOverItem === index ? 'scale-105 ring-2 ring-blue-400' : ''
          } ${
            colorDropTarget === index ? 'ring-4 ring-purple-400 scale-105' : ''
          }`}
          onMouseEnter={() => setHoveredCard(link.id)}
          onMouseLeave={() => setHoveredCard(null)}
          draggable={true}
          onDragStart={(e) => handleLinkDragStart(e, index)}
          onDragOver={(e) => handleLinkDragOver(e, index)}
          onDragLeave={(e) => handleLinkDragLeave(e)}
          onDragEnd={handleLinkDragEnd}
          onDrop={(e) => handleLinkDrop(e, index)}
        >
          <div
            className="glass-effect rounded-xl p-4 h-full cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-white/20"
            onClick={(e) => handleLinkClick(link.url, e)}
            style={{ 
              background: convertTailwindToCSS(getCategoryColor(link.category, link.customColor)),
              opacity: 0.9
            } as React.CSSProperties}
            onMouseEnter={() => {
              const finalColor = getCategoryColor(link.category, link.customColor)
              console.log(`Link: ${link.title} | Custom: ${link.customColor || 'none'} | Final: ${finalColor} | CSS: ${convertTailwindToCSS(finalColor)}`)
            }}
          >
            {/* Category Badge */}
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-black/30 text-white px-2 py-1 rounded-full">
                {link.category}
              </span>
            </div>

            {/* Icon */}
            <div className="text-white/90 mb-3">
              {getIcon(link.icon)}
            </div>

            {/* Title */}
            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1">
              {link.title}
            </h3>

            {/* Description */}
            <p className="text-white/80 text-xs mb-3 line-clamp-2">
              {link.description}
            </p>

            {/* Link indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <ExternalLink className="w-3 h-3" />
                Link
              </div>
              
              {/* Delete button - always visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('Delete button clicked for link ID:', link.id)
                  onDelete(link.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500/30 rounded"
                title="Linki Sil"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            {/* Drop zone indicator */}
            {colorDropTarget === index && (
              <div className="absolute inset-0 bg-purple-500/20 rounded-xl border-2 border-purple-400 border-dashed flex items-center justify-center">
                <span className="text-purple-200 text-xs font-medium">Rengi Bırak</span>
              </div>
            )}
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      ))}

      {/* Empty state */}
      {links.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="text-white/60 text-lg mb-2">
            Henüz link eklenmemiş
          </div>
          <div className="text-white/40 text-sm">
            "Yeni Link" butonuna tıklayarak ilk linkinizi ekleyin
          </div>
        </div>
      )}
    </div>
  )
}

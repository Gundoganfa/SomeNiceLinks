'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Trash2,
  Github,
  Globe,
  Database,
  Server,
  Cpu,
  Code,
} from 'lucide-react'

/** Import Link interface from parent */
import type { Link } from '../page'

// Tailwind gradient classlarını inline CSS'e çevirir (JIT purge sorunu için)
const convertTailwindToCSS = (gradientClass: string): string => {
  if (gradientClass === 'transparent') return 'transparent'
  
  const colorMap = {
    'red-500': '#ef4444', 'red-600': '#dc2626',
    'pink-500': '#ec4899', 'pink-600': '#db2777',
    'orange-500': '#f97316', 'orange-600': '#ea580c',
    'yellow-500': '#eab308', 'yellow-600': '#ca8a04',
    'green-500': '#22c55e', 'green-600': '#16a34a',
    'teal-500': '#14b8a6', 'teal-600': '#0d9488',
    'blue-500': '#3b82f6', 'blue-600': '#2563eb',
    'purple-500': '#a855f7', 'purple-600': '#9333ea',
    'indigo-500': '#6366f1', 'indigo-600': '#4f46e5',
    'violet-500': '#8b5cf6', 'violet-600': '#7c3aed',
    'cyan-500': '#06b6d4', 'cyan-600': '#0891b2',
    'rose-500': '#f43f5e', 'rose-600': '#e11d48',
    'emerald-500': '#10b981', 'emerald-600': '#059669',
    'slate-500': '#64748b', 'slate-600': '#475569',
    'gray-500': '#6b7280', 'gray-600': '#4b5563'
  }
  
  // "from-red-500 to-pink-600" format
  const match = gradientClass.match(/from-(\w+-\d+)\s+to-(\w+-\d+)/)
  if (match) {
    const [, fromColor, toColor] = match
    const from = colorMap[fromColor as keyof typeof colorMap] || '#3b82f6'
    const to = colorMap[toColor as keyof typeof colorMap] || '#9333ea'
    return `linear-gradient(to bottom right, ${from}, ${to})`
  }
  
  return 'transparent'
}

interface LinkGridProps {
  links: Link[]
  onDelete: (id: string) => void
  onReorder: (dragIndex: number, hoverIndex: number) => void
  onColorChange: (id: string, color: string) => void | Promise<void> // 'default' veya gradient string
  draggedColor: string | null
  onLinkClick?: (linkId: string) => void
}

/** Basit ikon seçici */
const getIcon = (iconName: string) => {
  const icons = {
    github: <Github className="h-6 w-6" />,
    globe: <Globe className="h-6 w-6" />,
    database: <Database className="h-6 w-6" />,
    server: <Server className="h-6 w-6" />,
    cpu: <Cpu className="h-6 w-6" />,
    code: <Code className="h-6 w-6" />,
  }
  return icons[iconName as keyof typeof icons] ?? <Globe className="h-6 w-6" />
}

export function LinkGrid({
  links,
  onDelete,
  onReorder,
  onColorChange,
  draggedColor,
  onLinkClick,
}: LinkGridProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const [colorDropTarget, setColorDropTarget] = useState<number | null>(null)

  const handleLinkClick = (link: Link, e: React.MouseEvent) => {
    // DnD esnasında yanlışlıkla link açılmasın
    if (colorDropTarget !== null || draggedItem !== null) {
      e.preventDefault()
      return
    }
    
    // Click tracking API'yi çağır (eğer callback verilmişse)
    if (onLinkClick) {
      onLinkClick(link.id)
    }
    
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  /** Reorder için link drag */
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `link:${index}`)
  }

  const handleLinkDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    // Palette’ten renk mi geliyor, kart mı? İkisini de kapsayalım.
    const hasText = e.dataTransfer.types?.includes?.('text/plain')
    if (draggedColor) {
      e.dataTransfer.dropEffect = 'copy'
      setColorDropTarget(index)
      return
    }
    if (hasText) {
      setColorDropTarget(index) // renk de olabilir, link de
      setDragOverItem(index)    // link sıralama görseli
    }
  }

  const handleLinkDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom

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

    const droppedData = e.dataTransfer.getData('text/plain')

    // 1) Renk bırakma (palette veya DataTransfer)
    let colorToApply: string | null = null
    if (droppedData && droppedData.startsWith('color:')) {
      colorToApply = droppedData.replace('color:', '')
    } else if (draggedColor) {
      colorToApply = draggedColor
    }
    if (colorToApply) {
      const link = links[dropIndex]
      console.log(`Changing color for link: ${link.title} to color: ${colorToApply}`)
      // 'default' ile rengi sıfırla; ebeveyn normalize edecek
      onColorChange(link.id, colorToApply)
      setColorDropTarget(null)
      return
    }

    // 2) Link sıralama (link:prefix)
    if (droppedData && droppedData.startsWith('link:')) {
      const draggedIndex = parseInt(droppedData.replace('link:', ''), 10)
      if (!Number.isNaN(draggedIndex) && draggedIndex !== dropIndex) {
        onReorder(draggedIndex, dropIndex)
      }
    }

    setDraggedItem(null)
    setDragOverItem(null)
    setColorDropTarget(null)
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      role="list"
    >
      {links.map((link, index) => {
        const useGradient = !!link.customColor
        // Custom gradient için inline style kullan (JIT purge sorunu için)
        const cardStyle = useGradient && link.customColor
          ? { background: convertTailwindToCSS(link.customColor) }
          : {}

        const ringClass =
          colorDropTarget === index
            ? 'ring-4 ring-purple-400 scale-105'
            : dragOverItem === index
            ? 'scale-105 ring-2 ring-blue-400'
            : draggedItem === index
            ? 'opacity-50'
            : ''

        return (
          <div
            key={link.id}
            className={`group relative ${ringClass}`}
            onMouseLeave={() => {
              setColorDropTarget(null)
              setDragOverItem(null)
            }}
            draggable
            onDragStart={(e) => handleLinkDragStart(e, index)}
            onDragOver={(e) => handleLinkDragOver(e, index)}
            onDragLeave={handleLinkDragLeave}
            onDragEnd={handleLinkDragEnd}
            onDrop={(e) => handleLinkDrop(e, index)}
            role="listitem"
            aria-label={link.title}
          >
            <div
              className={`glass-effect h-full cursor-pointer rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:bg-white/10 ${useGradient ? '' : 'bg-white/10'}`}
              style={cardStyle}
              onClick={(e) => handleLinkClick(link, e)}
            >
              {/* Kategori etiketi */}
              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-white">
                  {link.category}
                </span>
              </div>

              {/* Icon */}
              <div className="mb-3 text-white/90">{getIcon(link.icon)}</div>

              {/* Başlık */}
              <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-white">
                {link.title}
              </h3>

              {/* Açıklama */}
              <p className="mb-3 line-clamp-2 text-xs text-white/80">
                {link.description}
              </p>

              {/* Alt satır: Link göstergesi + Click sayısı + Sil butonu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </div>
                  {link.clickCount !== undefined && link.clickCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <span>👆</span>
                      <span>{link.clickCount}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(link.id)
                  }}
                  className="opacity-0 transition-opacity duration-200 hover:bg-red-500/30 group-hover:opacity-100 rounded p-1"
                  title="Linki Sil"
                  aria-label={`Sil: ${link.title}`}
                >
                  <Trash2 className="h-4 w-4 text-red-300" />
                </button>
              </div>

              {/* Renk bırakma görseli */}
              {colorDropTarget === index && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-purple-400 bg-purple-500/20">
                  <span className="text-xs font-medium text-purple-100">
                    Rengi Bırak
                  </span>
                </div>
              )}
            </div>

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        )
      })}

      {/* Empty state */}
      {links.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <div className="mb-2 text-lg text-white/60">Henüz link eklenmemiş</div>
          <div className="text-sm text-white/40">
            “Yeni Link” butonuna tıklayarak ilk linkinizi ekleyin
          </div>
        </div>
      )}
    </div>
  )
}

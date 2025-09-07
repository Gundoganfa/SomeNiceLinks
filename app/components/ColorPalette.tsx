'use client'

import { GRADIENTS } from '../constants'

interface ColorPaletteProps {
  draggedColor: string | null
  setDraggedColor: (color: string | null) => void
}

export function ColorPalette({ draggedColor, setDraggedColor }: ColorPaletteProps) {
  return (
    <div className="w-16 flex-shrink-0">
      <div className="sticky top-6">
        <h3 className="mb-3 text-center text-xs text-white/60">Renkler</h3>
        <div className="flex flex-col gap-2">
          {GRADIENTS.map((color, idx) => (
            <button
              key={idx}
              className={`h-8 w-12 cursor-grab rounded-lg border border-white/20 bg-gradient-to-br shadow-lg transition-transform hover:scale-110 active:cursor-grabbing ${color}`}
              draggable
              onDragStart={(e) => {
                setDraggedColor(color)
                e.dataTransfer.setData('text/plain', `color:${color}`)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onDragEnd={() => setDraggedColor(null)}
              title="Rengi sürükleyip karta bırakın"
              aria-label={`Renk: ${color}`}
            />
          ))}
          {/* Rengi Sil */}
          <button
            className="flex h-8 w-12 cursor-grab items-center justify-center rounded-lg border-2 border-dashed border-red-400/60 bg-red-500/10 transition-all hover:scale-110 hover:border-red-400 hover:bg-red-500/20 active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              setDraggedColor('default')
              e.dataTransfer.setData('text/plain', 'color:default')
              e.dataTransfer.effectAllowed = 'copy'
            }}
            onDragEnd={() => setDraggedColor(null)}
            title="Rengi sil - Varsayılan renge dön"
            aria-label="Rengi sil"
          >
            <span className="text-xs text-red-400">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  )
}

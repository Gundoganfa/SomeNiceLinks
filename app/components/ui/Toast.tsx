'use client'

import { X } from 'lucide-react'
import type { ToastItem } from '../../types'

interface ToastsProps {
  items: ToastItem[]
  onClose: (id: string) => void
}

export function Toasts({ items, onClose }: ToastsProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-md border px-3 py-2 shadow-lg backdrop-blur-sm ${
            t.kind === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : t.kind === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : t.kind === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-slate-500/10 border-slate-500/30 text-slate-200'
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm">{t.text}</span>
            <button
              onClick={() => onClose(t.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

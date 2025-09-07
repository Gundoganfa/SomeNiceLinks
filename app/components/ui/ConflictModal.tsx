'use client'

import { X, Cloud, HardDrive, GitMerge } from 'lucide-react'
import type { Link } from '../../types'

interface ConflictModalProps {
  open: boolean
  localLinks: Link[]
  cloudLinks: Link[]
  onUseLocal: () => void
  onUseCloud: () => void
  onMerge: () => void
  onClose: () => void
}

export function ConflictModal({
  open,
  localLinks,
  cloudLinks,
  onUseLocal,
  onUseCloud,
  onMerge,
  onClose
}: ConflictModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Link Çakışması Tespit Edildi
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-white/80 mb-4">
            Hem yerel cihazınızda hem de bulutta farklı linkler bulundu. Nasıl devam etmek istiyorsunuz?
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Yerel Linkler</span>
              </div>
              <p className="text-2xl font-bold text-white">{localLinks.length}</p>
              <p className="text-sm text-white/60">Bu cihazda</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-green-400" />
                <span className="font-medium text-white">Bulut Linkler</span>
              </div>
              <p className="text-2xl font-bold text-white">{cloudLinks.length}</p>
              <p className="text-sm text-white/60">Sunucuda</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* Use Local */}
          <button
            onClick={onUseLocal}
            className="w-full p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-left transition-colors group"
          >
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-blue-400 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-medium text-white mb-1">Yerel Linkleri Kullan</h4>
                <p className="text-sm text-white/70">
                  Bu cihazdaki linkleri kullan ve buluta kaydet. Buluttaki linkler silinecek.
                </p>
              </div>
            </div>
          </button>

          {/* Use Cloud */}
          <button
            onClick={onUseCloud}
            className="w-full p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-left transition-colors group"
          >
            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-green-400 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-medium text-white mb-1">Bulut Linklerini Kullan</h4>
                <p className="text-sm text-white/70">
                  Buluttaki linkleri kullan. Bu cihazdaki linkler silinecek.
                </p>
              </div>
            </div>
          </button>

          {/* Merge */}
          <button
            onClick={onMerge}
            className="w-full p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-left transition-colors group"
          >
            <div className="flex items-start gap-3">
              <GitMerge className="w-5 h-5 text-purple-400 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-medium text-white mb-1">Linkleri Birleştir</h4>
                <p className="text-sm text-white/70">
                  Her iki setten linkleri birleştir. Aynı URL'ye sahip linkler için yerel olanı kullan.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm text-amber-200">
            <span className="font-medium">⚠️ Uyarı:</span> Bu işlem geri alınamaz. Seçiminizi dikkatlice yapın.
          </p>
        </div>
      </div>
    </div>
  )
}

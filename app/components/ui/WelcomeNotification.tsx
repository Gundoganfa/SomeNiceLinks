'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Lightbulb } from 'lucide-react'

interface WelcomeNotificationProps {
  show: boolean
  onClose: () => void
  onAddLink: () => void
}

export function WelcomeNotification({ show, onClose, onAddLink }: WelcomeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progressStarted, setProgressStarted] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Animation için bekleme
  }, [onClose])

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Progress bar animasyonunu başlat
      const progressTimer = setTimeout(() => {
        setProgressStarted(true)
      }, 100)
      
      // 3 saniye sonra otomatik kapat
      const closeTimer = setTimeout(() => {
        handleClose()
      }, 3000)

      return () => {
        clearTimeout(progressTimer)
        clearTimeout(closeTimer)
      }
    }
  }, [show, handleClose])

  const handleAddLinkClick = useCallback(() => {
    handleClose()
    onAddLink()
  }, [handleClose, onAddLink])

  if (!show) return null

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-blue-600/90 backdrop-blur-md rounded-lg border border-blue-500/50 p-4 shadow-xl max-w-md mx-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium mb-2">
              👋 Hoş geldiniz!
            </p>
            <p className="text-blue-100 text-sm mb-3">
              Koleksiyonunuz henüz boş görünüyor. Yeni linkler ekleyerek başlayabilirsiniz.
            </p>
            
            {/* Action Button */}
            <button
              onClick={handleAddLinkClick}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Link Ekle
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-blue-400/30 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-blue-300 rounded-full transition-all ease-linear ${
              progressStarted ? 'duration-[2900ms] w-0' : 'w-full'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { useLinks } from './hooks/useLinks'
import { Header } from './components/Header'
import { SearchAndFilter } from './components/SearchAndFilter'
import { ColorPalette } from './components/ColorPalette'
import { FinancialData } from './components/FinancialData'
import { LinkGrid } from './components/LinkGrid'
import { AddLinkModal } from './components/AddLinkModal'
import { Toasts } from './components/ui/Toast'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { ConflictModal } from './components/ui/ConflictModal'
import { WelcomeNotification } from './components/ui/WelcomeNotification'

export default function Home() {
  const {
    // Data
    links,
    filteredLinks,
    categories,
    query,
    category,
    backgroundTheme,
    
    // UI State
    showAddModal,
    showSettings,
    draggedColor,
    mergeImport,
    showClickCount,
    
    // Confirm dialogs
    confirmResetOpen,
    confirmClearOpen,
    
    // Conflict resolution
    conflictModalOpen,
    cloudLinksConflict,
    localLinksConflict,
    
    // Toast system
    toasts,
    closeToast,
    
    // Setters
    setQuery,
    setCategory,
    setShowAddModal,
    setShowSettings,
    setDraggedColor,
    setMergeImport,
    setConfirmResetOpen,
    setConfirmClearOpen,
    
    // Actions
    addLink,
    deleteLink,
    reorderVisible,
    changeColor,
    changeBackgroundTheme,
    toggleClickCount,
    exportLinks,
    importLinks,
    loadDefaults,
    doResetToDefaults,
    clearAllLinks,
    doClearAllLinks,
    incrementClickCount,
    
    // Conflict resolution
    useLocalLinks,
    useCloudLinks,
    mergeLinks,
    setConflictModalOpen,
    checkCloudSync,
    
    // User info
    isSignedIn,
    user,
  } = useLinks()

  const settingsRef = useRef<HTMLDivElement>(null)
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)

  // Welcome notification kontrolü
  useEffect(() => {
    // Sadece ilk yüklemede ve henüz gösterilmemişse kontrol et
    if (!hasShownWelcome && links.length < 2) {
      const timer = setTimeout(() => {
        setShowWelcomeNotification(true)
        setHasShownWelcome(true)
      }, 500) // Kısa delay - sayfa yüklendikten sonra göster

      return () => clearTimeout(timer)
    }
  }, [links.length, hasShownWelcome])

  // Click outside settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings, setShowSettings])

  return (
    <div className={`min-h-screen ${backgroundTheme} p-4 lg:p-6 text-white`}>
      {/* Tailwind safelist helper for gradients (hidden) */}
      <div className="hidden">
        {/* Link card gradients */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600" />
        <div className="bg-gradient-to-br from-orange-500 to-yellow-600" />
        <div className="bg-gradient-to-br from-green-500 to-teal-600" />
        <div className="bg-gradient-to-br from-blue-500 to-purple-600" />
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600" />
        <div className="bg-gradient-to-br from-pink-500 to-rose-600" />
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600" />
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600" />
        <div className="bg-gradient-to-br from-violet-500 to-purple-600" />
        <div className="bg-gradient-to-br from-emerald-500 to-green-600" />
        <div className="bg-gradient-to-br from-slate-500 to-gray-600" />

        {/* Background themes */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900" />
        <div className="bg-gradient-to-b from-blue-950 to-blue-900" />
        <div className="bg-gradient-to-b from-purple-950 to-purple-900" />
        <div className="bg-gradient-to-b from-emerald-950 to-emerald-900" />
        <div className="bg-gradient-to-b from-red-950 to-red-900" />
        <div className="bg-gradient-to-b from-gray-900 to-black" />
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900" />
        <div className="bg-gradient-to-br from-orange-900 via-red-900 to-pink-900" />
        <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900" />
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
      </div>

      {/* Toasts */}
      <Toasts items={toasts} onClose={closeToast} />

      {/* Welcome Notification */}
      <WelcomeNotification
        show={showWelcomeNotification}
        onClose={() => setShowWelcomeNotification(false)}
        onAddLink={() => setShowAddModal(true)}
      />

      {/* Confirm Reset */}
      <ConfirmDialog
        open={confirmResetOpen}
        title="Varsayılan linkler yüklensin mi?"
        description="Bu işlem mevcut tüm linkleri siler ve varsayılanları yükler."
        confirmText="Evet, yükle"
        cancelText="Vazgeç"
        onConfirm={doResetToDefaults}
        onClose={() => setConfirmResetOpen(false)}
      />

      {/* Confirm Clear All */}
      <ConfirmDialog
        open={confirmClearOpen}
        title="Tüm linkler silinsin mi?"
        description="Bu işlem geri alınamaz. Tüm linkleriniz kalıcı olarak silinecek."
        confirmText="Evet, sil"
        cancelText="Vazgeç"
        onConfirm={doClearAllLinks}
        onClose={() => setConfirmClearOpen(false)}
      />

      {/* Conflict Resolution Modal */}
      <ConflictModal
        open={conflictModalOpen}
        localLinks={localLinksConflict}
        cloudLinks={cloudLinksConflict}
        onUseLocal={useLocalLinks}
        onUseCloud={useCloudLinks}
        onMerge={mergeLinks}
        onClose={() => setConflictModalOpen(false)}
      />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <Header
          user={user}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          setShowAddModal={setShowAddModal}
          mergeImport={mergeImport}
          setMergeImport={setMergeImport}
          backgroundTheme={backgroundTheme}
          changeBackgroundTheme={changeBackgroundTheme}
          showClickCount={showClickCount}
          toggleClickCount={toggleClickCount}
          exportLinks={exportLinks}
          importLinks={importLinks}
          loadDefaults={loadDefaults}
          clearAllLinks={clearAllLinks}
          checkCloudSync={checkCloudSync}
        />

          {/* Search & Filter */}
        <SearchAndFilter
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          categories={categories}
          totalLinks={links.length}
          filteredCount={filteredLinks.length}
        />

        {/* Financial Data */}
        <section className="mb-6">
          <FinancialData />
        </section>

        {/* Links & Palette */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Link Koleksiyonum</h2>

            {/* Auth Status Info */}
            <SignedOut>
              <div className="hidden sm:block text-sm text-white/60">
                💡 Giriş yapın, linkleriniz bulutla senkronlansın
              </div>
            </SignedOut>

            <SignedIn>
              <div className="hidden sm:block text-sm text-white/60">
                ☁️ Bulut senkronizasyonu aktif
              </div>
            </SignedIn>
          </div>

          {/* Mobile Auth Info */}
          <SignedOut>
            <div className="mb-4 sm:hidden rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <span className="font-medium">💡 İpucu:</span> Giriş yaparsanız linkleriniz tüm
              cihazlarınızda senkronlanır.
            </div>
          </SignedOut>

          <div className="flex gap-6">
            {/* Color Palette - Left */}
            <ColorPalette 
              draggedColor={draggedColor}
              setDraggedColor={setDraggedColor}
            />

            {/* Links Grid - Right */}
            <div className="flex-1">
              <LinkGrid
                links={filteredLinks}
                onDelete={deleteLink}
                onReorder={reorderVisible}
                onColorChange={changeColor}
                onClickTrack={incrementClickCount}
                showClickCount={showClickCount}
                draggedColor={draggedColor}
              />
            </div>
          </div>
        </section>

        {/* Add Link Modal */}
        {showAddModal && (
          <AddLinkModal onAdd={addLink} onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  )
}
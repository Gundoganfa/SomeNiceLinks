'use client'

import { useRef } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Settings, Plus, Download, Upload, RotateCcw, Trash2 } from 'lucide-react'
import { BACKGROUND_THEMES } from '../constants'
import type { BackgroundTheme } from '../types'

interface HeaderProps {
  user: any
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  setShowAddModal: (show: boolean) => void
  mergeImport: boolean
  setMergeImport: (merge: boolean) => void
  backgroundTheme: string
  changeBackgroundTheme: (theme: string) => void
  exportLinks: () => void
  importLinks: (event: React.ChangeEvent<HTMLInputElement>) => void
  loadDefaults: () => void
  clearAllLinks: () => void
}

export function Header({
  user,
  showSettings,
  setShowSettings,
  setShowAddModal,
  mergeImport,
  setMergeImport,
  backgroundTheme,
  changeBackgroundTheme,
  exportLinks,
  importLinks,
  loadDefaults,
  clearAllLinks,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  const onPickFile = () => fileInputRef.current?.click()

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold lg:text-5xl">SomeNice Links</h1>

        <div className="flex items-center gap-3">
          {/* Auth Section */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700">
                🔐 Giriş Yap
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">
                Merhaba, {user?.firstName || 'Kullanıcı'}!
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          {/* Settings Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors duration-200 hover:bg-slate-600"
              title="Ayarlar"
            >
              <Settings size={18} />
              Ayarlar
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-slate-800 shadow-2xl">
                <div className="py-2">
                  {/* Export */}
                  <button
                    onClick={() => {
                      exportLinks()
                      setShowSettings(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                  >
                    <Download size={16} />
                    Export Links
                  </button>

                  {/* Import */}
                  <button
                    onClick={() => {
                      onPickFile()
                      setShowSettings(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                  >
                    <Upload size={16} />
                    Import Links
                  </button>

                  {/* Merge Toggle */}
                  <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm text-white hover:bg-slate-700">
                    <input
                      type="checkbox"
                      className="accent-purple-600"
                      checked={mergeImport}
                      onChange={(e) => setMergeImport(e.target.checked)}
                    />
                    <span>Merge while importing</span>
                  </label>

                  <hr className="my-2 border-white/10" />

                  {/* Background Theme */}
                  <div className="px-4 py-2">
                    <div className="mb-2 text-xs text-white/60">
                      Background Theme
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {BACKGROUND_THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => changeBackgroundTheme(theme.class)}
                          className={`relative overflow-hidden rounded-md border text-xs p-2 transition-all ${
                            backgroundTheme === theme.class
                              ? 'border-white/40 ring-1 ring-white/20'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div
                            className={`absolute inset-0 ${theme.class} opacity-30`}
                          />
                          <div className="relative z-10 text-white">
                            {theme.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="my-2 border-white/10" />

                  {/* Load Defaults */}
                  <button
                    onClick={() => {
                      loadDefaults()
                      setShowSettings(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                  >
                    <RotateCcw size={16} />
                    Load Defaults
                  </button>

                  {/* Clear All */}
                  <button
                    onClick={() => {
                      clearAllLinks()
                      setShowSettings(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                    Clear All Links
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importLinks}
              className="hidden"
            />
          </div>

          {/* Add Link */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700"
          >
            <Plus size={20} />
            Yeni Link
          </button>
        </div>
      </div>
    </header>
  )
}

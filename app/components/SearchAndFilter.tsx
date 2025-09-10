'use client'

import { Search, X } from 'lucide-react'

interface SearchAndFilterProps {
  query: string
  setQuery: (query: string) => void
  category: string
  setCategory: (category: string) => void
  categories: string[]
  totalLinks: number
  filteredCount: number
}

export function SearchAndFilter({
  query,
  setQuery,
  category,
  setCategory,
  categories,
  totalLinks,
  filteredCount,
}: SearchAndFilterProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ara: başlık, URL, açıklama…"
            className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2 text-sm text-white placeholder:text-white/50 outline-none ring-blue-500 focus:ring-2"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 hover:bg-white/10 hover:opacity-100"
              aria-label="Aramayı temizle"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-white/10 bg-slate-700 text-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-white/70">
        Toplam{' '}
        <span className="font-semibold text-white">{totalLinks}</span> | Görünen{' '}
        <span className="font-semibold text-white">
          {filteredCount}
        </span>
      </div>
    </div>
  )
}

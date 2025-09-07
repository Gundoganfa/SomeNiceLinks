// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SomeNice Links - Link Havuzum',
  description: 'Personel Link Collection and Financial Data Pool',
}

const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!pk) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  }

  return (
    <ClerkProvider publishableKey={pk}>
      <html lang="tr">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}

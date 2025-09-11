// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SomeNice Links - Personal Link Manager & Financial Tracker',
  description: 'Modern personal link and bookmark collection tool with cloud sync, drag & drop organization, and real-time financial data tracking. Organize your bookmarks with ease.',
  keywords: [
    'bookmark manager',
    'bookmark organizer', 
    'bookmark collection',
    'bookmark tool',
    'bookmark app',
    'bookmark organizer',
    'bookmark collection',
    'bookmark tool',
    'bookmark app',
    'personal productivity',
    'link manager',
    'link collection',
    'link tool',
    'link app',
    'link organizer',
    'link collection',
    'link tool',
    'link app',
    'financial tracker',
    'productivity app',
    'personal dashboard'
  ],
  authors: [{ name: 'SomeNice Links' }],
  creator: 'KafacoGameLab',
  publisher: 'KafacoGameLab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://somenice-links.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SomeNice Links - Personal Link Manager',
    description: 'Modern personal link collection tool with cloud sync, drag & drop organization, and real-time financial data tracking.',
    url: 'https://somenice-links.vercel.app',
    siteName: 'SomeNice Links',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SomeNice Links - Personal Link Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SomeNice Links - Personal Link Manager',
    description: 'Modern personal link collection tool with cloud sync and financial tracking.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!clerkPublishableKey) {
    console.warn('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is missing')
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey || ''}>
      <html lang="tr">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/favicon.ico" />
          <meta name="google-site-verification" content="9TN2Z0c9q7b5qTRjS0HUUT0QeDq-lw8WcYBobBPqtCw" />
          <meta name="theme-color" content="#2563eb" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}

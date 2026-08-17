import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { CommandCenterProvider } from '@/lib/command-center-store'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { ThemeProvider, themeBootstrapScript } from '@/components/theme/theme-provider'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'المساحة الشخصية | مركز القيادة',
  description: 'نظام تشغيل شخصي عربي لتنظيم اليوم والمهام والعادات والحياة.',
  applicationName: 'المساحة الشخصية',
  keywords: ['تنظيم اليوم', 'المهام', 'العادات', 'خطة اليوم', 'مركز القيادة الشخصية'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#ededf0',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${cairo.variable} font-sans antialiased`}>
        <PwaRegister />
        <ThemeProvider>
          <CommandCenterProvider>
            {children}
          </CommandCenterProvider>
        </ThemeProvider>
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}

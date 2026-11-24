import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

const siteUrl = 'https://mybuddio.vercel.app';
const siteTitle = 'Buddio — All-in-One AI Personal Productivity & Workspace';
const siteDescription =
  'Buddio is an intelligent, private AI productivity assistant and daily workspace. Organize tasks, schedule events, run Pomodoro deep-work cycles, manage finances, and orchestrate goals with AI assistance.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | Buddio',
  },
  description: siteDescription,
  applicationName: 'Buddio',
  keywords: [
    'Buddio',
    'AI productivity assistant',
    'personal workspace',
    'task manager',
    'smart calendar',
    'Pomodoro timer',
    'notes organizer',
    'goal tracking',
    'expense tracker',
    'AI assistant',
    'personal CRM',
    'daily planner',
    'glassmorphism UI',
    'intelligent task management',
  ],
  authors: [{ name: 'Praveen Eswaramoorthi', url: siteUrl }],
  creator: 'Praveen Eswaramoorthi',
  publisher: 'Buddio',
  category: 'Productivity',
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/buddio-icon.png', sizes: 'any' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/buddio-icon.png', sizes: '512x512' },
    ],
    shortcut: '/buddio-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Buddio',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Buddio',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/buddio-icon.png`,
        width: 512,
        height: 512,
        alt: 'Buddio AI Productivity Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/buddio-icon.png`],
    creator: '@praveeneswaramoorthi',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#7864F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Buddio',
  url: siteUrl,
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  description: siteDescription,
  image: `${siteUrl}/buddio-icon.png`,
  creator: {
    '@type': 'Person',
    name: 'Praveen Eswaramoorthi',
    url: siteUrl,
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI-powered daily planning & task breakdown',
    'Smart calendar & synchronized timelines',
    'Deep work focus Pomodoro timer',
    'Interactive markdown notes editor',
    'Goal roadmap & milestone tracking',
    'Expense & personal finance analytics',
    'Fast file storage & cloud integration',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/buddio-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

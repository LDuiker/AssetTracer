import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Enhanced SEO metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://www.asset-tracer.com'),
  
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  
  // Primary metadata
  title: {
    default: "AssetTracer - Track Assets, Send Quotes, Know Your Profit",
    template: "%s | AssetTracer",
  },
  description: "Professional asset management and invoicing system built for growing businesses. Track assets, manage inventory, send quotes, and monitor profitability. Simple, powerful, and easy to use.",
  
  // Keywords (helpful for SEO context)
  keywords: [
    'asset management',
    'asset tracking',
    'inventory management',
    'equipment tracking',
    'invoicing software',
    'quotation software',
    'business asset management',
    'depreciation tracking',
    'asset management software',
    'small business asset tracking',
  ],
  
  // Authors and creator
  authors: [{ name: 'AssetTracer Team' }],
  creator: 'AssetTracer',
  publisher: 'AssetTracer',
  
  // Prevent auto-detection of phone/email (better UX)
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Open Graph (for social sharing - Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.asset-tracer.com',
    siteName: 'AssetTracer',
    title: 'AssetTracer - Professional Asset Management & Invoicing',
    description: 'Track assets, manage inventory, send quotes, and know your profit. Built for growing businesses.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AssetTracer - Asset Management Software',
      },
    ],
  },
  
  // Twitter Card (for Twitter/X sharing)
  twitter: {
    card: 'summary_large_image',
    title: 'AssetTracer - Track Assets, Send Quotes, Know Your Profit',
    description: 'Professional asset management and invoicing for growing businesses.',
    // creator: '@assettracer', // Add when you create Twitter account
    images: ['/opengraph-image'],
  },
  
  // Robots configuration (indexing rules)
  robots: {
    index: true, // Allow homepage indexing
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (add these after setting up Google Search Console)
  // verification: {
  //   google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  //   yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
  //   bing: 'YOUR_BING_VERIFICATION_CODE',
  // },
  
  // Other metadata
  category: 'Business Software',
  applicationName: 'AssetTracer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" richColors />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_TRACKING_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : (
          // Debug: Only show in development
          process.env.NODE_ENV === 'development' && (
            <Script id="ga-debug" strategy="afterInteractive">
              {`console.warn('[GA Debug] NEXT_PUBLIC_GA_TRACKING_ID is not set');`}
            </Script>
          )
        )}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

/**
 * Homepage Metadata - SEO Optimized
 * This metadata is specific to the homepage and overrides the root layout defaults
 */
export const metadata: Metadata = {
  title: 'Asset Management Software | Track Assets & Send Invoices | AssetTracer',
  description: 'Professional asset management and invoicing software for growing businesses. Track assets, manage inventory, create quotations, send invoices, and monitor profitability. Simple, powerful, and easy to use. Start free today.',
  keywords: [
    'asset management software',
    'asset tracking software',
    'inventory management',
    'equipment tracking',
    'invoicing software',
    'quotation software',
    'business asset management',
    'small business software',
    'asset management system',
    'inventory tracking',
    'equipment management',
    'depreciation tracking',
    'SME asset management',
    'business invoicing',
    'asset management for small business',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.asset-tracer.com',
    siteName: 'AssetTracer',
    title: 'Asset Management Software | Track Assets & Send Invoices',
    description: 'Professional asset management and invoicing software for growing businesses. Track assets, manage inventory, create quotations, and monitor profitability. Start free today.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AssetTracer - Professional Asset Management & Invoicing Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asset Management Software | Track Assets & Send Invoices',
    description: 'Professional asset management and invoicing software for growing businesses. Simple, powerful, and easy to use.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.asset-tracer.com',
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
};

export default function LandingPage() {
  return <LandingPageClient />;
}

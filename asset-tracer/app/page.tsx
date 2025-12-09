import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';
import { StructuredData } from '@/components/seo/StructuredData';

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
        url: '/opengraph-image',
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
    images: ['/opengraph-image'],
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
  return (
    <>
      <StructuredData
        organization={{
          name: 'AssetTracer',
          url: 'https://www.asset-tracer.com',
          logo: 'https://www.asset-tracer.com/asset-tracer-logo.svg',
          description: 'Professional asset management and invoicing software for growing businesses.',
          sameAs: [
            // Add social media profiles when available
            // 'https://twitter.com/assettracer',
            // 'https://linkedin.com/company/assettracer',
          ],
          contactPoint: {
            contactType: 'Customer Service',
            // email: 'support@asset-tracer.com', // Add when available
          },
        }}
        softwareApplication={{
          name: 'AssetTracer',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'Professional asset management and invoicing software for growing businesses. Track assets, manage inventory, create quotations, send invoices, and monitor profitability.',
          offers: {
            price: '0',
            priceCurrency: 'USD',
            availability: 'InStock',
          },
          // aggregateRating: {
          //   ratingValue: '4.8',
          //   ratingCount: '150',
          // },
        }}
      />
      <LandingPageClient />
    </>
  );
}

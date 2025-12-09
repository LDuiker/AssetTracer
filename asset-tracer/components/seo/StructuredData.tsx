/**
 * Structured Data (JSON-LD) Component
 * 
 * Provides JSON-LD structured data for SEO
 * Supports: Organization, SoftwareApplication, Article, BreadcrumbList
 */

import Script from 'next/script';

interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[]; // Social media profiles
  contactPoint?: {
    contactType: string;
    email?: string;
    telephone?: string;
  };
}

interface SoftwareApplicationSchema {
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    price: string;
    priceCurrency: string;
    availability?: string;
  };
  aggregateRating?: {
    ratingValue: string;
    ratingCount: string;
  };
  description?: string;
}

interface ArticleSchema {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo?: string;
  };
}

interface BreadcrumbListSchema {
  items: Array<{
    name: string;
    url: string;
  }>;
}

interface StructuredDataProps {
  organization?: OrganizationSchema;
  softwareApplication?: SoftwareApplicationSchema;
  article?: ArticleSchema;
  breadcrumbList?: BreadcrumbListSchema;
}

export function StructuredData({
  organization,
  softwareApplication,
  article,
  breadcrumbList,
}: StructuredDataProps) {
  const schemas: object[] = [];

  // Organization Schema
  if (organization) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
      ...(organization.logo && {
        logo: organization.logo,
      }),
      ...(organization.description && {
        description: organization.description,
      }),
      ...(organization.sameAs && organization.sameAs.length > 0 && {
        sameAs: organization.sameAs,
      }),
      ...(organization.contactPoint && {
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: organization.contactPoint.contactType,
          ...(organization.contactPoint.email && {
            email: organization.contactPoint.email,
          }),
          ...(organization.contactPoint.telephone && {
            telephone: organization.contactPoint.telephone,
          }),
        },
      }),
    });
  }

  // SoftwareApplication Schema
  if (softwareApplication) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: softwareApplication.name,
      applicationCategory: softwareApplication.applicationCategory,
      operatingSystem: softwareApplication.operatingSystem,
      offers: {
        '@type': 'Offer',
        price: softwareApplication.offers.price,
        priceCurrency: softwareApplication.offers.priceCurrency,
        ...(softwareApplication.offers.availability && {
          availability: `https://schema.org/${softwareApplication.offers.availability}`,
        }),
      },
      ...(softwareApplication.description && {
        description: softwareApplication.description,
      }),
      ...(softwareApplication.aggregateRating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: softwareApplication.aggregateRating.ratingValue,
          ratingCount: softwareApplication.aggregateRating.ratingCount,
        },
      }),
    });
  }

  // Article Schema
  if (article) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.headline,
      description: article.description,
      ...(article.image && {
        image: article.image,
      }),
      datePublished: article.datePublished,
      ...(article.dateModified && {
        dateModified: article.dateModified,
      }),
      author: {
        '@type': 'Person',
        name: article.author.name,
        ...(article.author.url && {
          url: article.author.url,
        }),
      },
      publisher: {
        '@type': 'Organization',
        name: article.publisher.name,
        ...(article.publisher.logo && {
          logo: {
            '@type': 'ImageObject',
            url: article.publisher.logo,
          },
        }),
      },
    });
  }

  // BreadcrumbList Schema
  if (breadcrumbList) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbList.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }

  if (schemas.length === 0) {
    return null;
  }

  // If only one schema, return it directly; otherwise wrap in array
  const jsonLd = schemas.length === 1 ? schemas[0] : schemas;

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}


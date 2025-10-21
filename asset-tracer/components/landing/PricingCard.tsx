/**
 * PricingCard Component
 * 
 * A reusable pricing card component for displaying subscription plans.
 * 
 * @example
 * ```tsx
 * <PricingCard
 *   title="Pro"
 *   price={29}
 *   period="month"
 *   description="For growing businesses"
 *   features={['Feature 1', 'Feature 2', 'Feature 3']}
 *   highlighted={true}
 *   ctaText="Start Trial"
 *   onCtaClick={() => router.push('/signup')}
 * />
 * ```
 */

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PricingCardProps {
  title: string;
  price: number;
  period: string;
  description?: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  onCtaClick: () => void;
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  highlighted = false,
  ctaText,
  onCtaClick,
}: PricingCardProps) {
  return (
    <Card 
      className={`border-2 relative transition-all hover:shadow-lg ${
        highlighted 
          ? 'border-accent-cyan shadow-xl' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-cyan hover:bg-accent-cyan/90">
          Most Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="mt-4">
          <span className="text-4xl font-bold text-text-primary">${price}</span>
          <span className="text-gray-600">/{period}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={onCtaClick}
          className={`w-full ${
            highlighted
              ? 'bg-accent-cyan hover:bg-accent-cyan/90 text-white'
              : 'bg-transparent hover:bg-gray-50 text-text-primary border border-gray-300'
          }`}
        >
          {ctaText}
        </Button>
      </CardContent>
    </Card>
  );
}


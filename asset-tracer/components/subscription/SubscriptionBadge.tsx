'use client';

import { Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/lib/context/SubscriptionContext';

interface SubscriptionBadgeProps {
  feature?: string;
  showUpgrade?: boolean;
}

export function SubscriptionBadge({ feature, showUpgrade = false }: SubscriptionBadgeProps) {
  const { tier, limits, redirectToUpgrade } = useSubscription();

  if (tier === 'free' && showUpgrade) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Free Plan</p>
                <p className="text-sm text-gray-600">
                  {feature ? `You've reached the limit for ${feature}. Upgrade to Pro for unlimited access.` : 'Basic features included'}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={redirectToUpgrade}
            >
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierConfig = {
    free: {
      label: 'Free',
      className: 'bg-gray-100 text-gray-800',
      icon: null,
    },
    pro: {
      label: 'Pro',
      className: 'bg-blue-100 text-blue-800',
      icon: <Crown className="h-3 w-3" />,
    },
    business: {
      label: 'Business',
      className: 'bg-purple-100 text-purple-800',
      icon: <Zap className="h-3 w-3" />,
    },
  };

  const config = tierConfig[tier];

  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

interface UsageBadgeProps {
  current: number;
  max: number;
  label: string;
}

export function UsageBadge({ current, max, label }: UsageBadgeProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{label}:</span>
      <Badge 
        variant="outline"
        className={`${
          isAtLimit 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : isNearLimit 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-green-50 text-green-700 border-green-200'
        }`}
      >
        {current} / {max}
      </Badge>
    </div>
  );
}


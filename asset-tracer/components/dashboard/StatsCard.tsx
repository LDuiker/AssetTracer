import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary-blue',
  bgColor = 'bg-primary-blue/10',
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-text-primary dark:text-white mb-1">
          {value}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}


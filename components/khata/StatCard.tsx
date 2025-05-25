'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
  iconColor = 'bg-primary/20 text-primary'
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl">{value}</CardTitle>
          {icon && (
            <div className={`rounded-full p-2 ${iconColor}`}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {trend ? (
          <div className="flex items-center">
            <span className={`mr-1 text-xs ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {description || ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

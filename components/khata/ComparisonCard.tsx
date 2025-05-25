'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ComparisonCardProps {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftAmount: number;
  rightAmount: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftColor?: string;
  rightColor?: string;
  formatCurrency?: (value: number) => string;
}

export function ComparisonCard({
  title,
  description,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftAmount,
  rightAmount,
  leftIcon,
  rightIcon,
  leftColor = 'text-blue-600 bg-blue-100',
  rightColor = 'text-green-600 bg-green-100',
  formatCurrency = (val) => val.toString(),
}: ComparisonCardProps) {
  const total = leftValue + rightValue;
  const leftPercentage = total > 0 ? Math.round((leftValue / total) * 100) : 0;
  const rightPercentage = total > 0 ? Math.round((rightValue / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm mb-2">
            <div className="font-medium">{leftLabel}</div>
            <div className="font-medium">{rightLabel}</div>
          </div>
          
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
              style={{ width: `${leftPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="font-medium">{leftPercentage}%</div>
            <div className="font-medium">{rightPercentage}%</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Left stat */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className={`rounded-full p-1.5 ${leftColor}`}>
                  {leftIcon || <ArrowUp className="h-4 w-4" />}
                </div>
                <div className="text-sm font-medium">{leftLabel}</div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{leftValue}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(leftAmount)}
                </div>
              </div>
            </div>
            
            {/* Right stat */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className={`rounded-full p-1.5 ${rightColor}`}>
                  {rightIcon || <ArrowDown className="h-4 w-4" />}
                </div>
                <div className="text-sm font-medium">{rightLabel}</div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{rightValue}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(rightAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle } from 'lucide-react';
import { DonutChart } from './DonutChart';

interface PendingResolvedCardProps {
  title: string;
  description: string;
  pendingCount: number;
  resolvedCount: number;
  pendingAmount: number;
  resolvedAmount: number;
  formatCurrency: (value: number) => string;
}

export function PendingResolvedCard({
  title,
  description,
  pendingCount,
  resolvedCount,
  pendingAmount,
  resolvedAmount,
  formatCurrency
}: PendingResolvedCardProps) {
  const total = pendingCount + resolvedCount;
  const pendingPercentage = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
  const resolvedPercentage = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    const chartData = {
    labels: ['Pending Approval', 'Approved'],
    datasets: [
      {
        data: [pendingCount, resolvedCount],
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)', // Amber for pending approval
          'rgba(16, 185, 129, 0.7)'  // Green for approved
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            <DonutChart data={chartData} />
          </div>
          <div className="space-y-4">
            {/* Pending transactions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">              <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-1.5 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="font-medium">Pending Approval</div>
                </div>
                <div className="text-sm">{pendingPercentage}%</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>{pendingCount} transactions</div>
                <div className="font-medium">{formatCurrency(pendingAmount)}</div>
              </div>
            </div>
            
            {/* Approved transactions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1.5 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="font-medium">Approved</div>
                </div>
                <div className="text-sm">{resolvedPercentage}%</div>
              </div>
              <div className="flex items-center justify-between text-sm">                <div>{resolvedCount} transactions</div>
                <div className="font-medium">{formatCurrency(resolvedAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

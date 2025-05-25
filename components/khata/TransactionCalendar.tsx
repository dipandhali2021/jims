'use client';

import { useState, useMemo } from 'react';
import { addDays, startOfMonth, endOfMonth, format, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionDay {
  date: string;
  totalAmount: number;
  count: number;
}

interface TransactionCalendarProps {
  transactions: TransactionDay[];
  payments: TransactionDay[];
  title: string;
  description?: string;
  colorClass?: string;
}

export function TransactionCalendar({
  transactions,
  payments,
  title,
  description,
  colorClass = 'bg-blue-50 text-blue-900'
}: TransactionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const endDate = new Date(monthEnd);
    if (endDate.getDay() !== 6) { // If not Saturday
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    }

    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    
    return days;
  }, [currentMonth]);

  // Find data for specific day
  const getDataForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      transaction: transactions.find(t => t.date === dateStr),
      payment: payments.find(p => p.date === dateStr)
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <div className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          <div className="py-2">Sun</div>
          <div className="py-2">Mon</div>
          <div className="py-2">Tue</div>
          <div className="py-2">Wed</div>
          <div className="py-2">Thu</div>
          <div className="py-2">Fri</div>
          <div className="py-2">Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-1">
          {calendarDays.map((day, i) => {
            const dayData = getDataForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={i}
                className={cn(
                  "aspect-square p-1 flex flex-col items-center justify-center text-center rounded-md text-xs relative",
                  !isCurrentMonth && "opacity-30",
                  isToday && "ring-2 ring-offset-2 ring-offset-background ring-primary",
                )}
              >
                <span className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  isCurrentMonth ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}>{format(day, 'd')}</span>
                
                {(dayData.transaction || dayData.payment) && (
                  <div className="mt-5 w-full space-y-1">
                    {dayData.transaction && (
                      <div>
                        <div className={cn(
                          "text-2xs px-1 py-0.5 rounded-sm truncate",
                          colorClass,
                          dayData.transaction.count > 0 && "font-medium"
                        )}>
                          {dayData.transaction.count} tx
                        </div>
                        <div className="text-2xs font-medium truncate">{formatCurrency(dayData.transaction.totalAmount)}</div>
                      </div>
                    )}
                    {dayData.payment && (
                      <div>
                        <div className={cn(
                          "text-2xs px-1 py-0.5 rounded-sm truncate bg-emerald-50 text-emerald-900",
                          dayData.payment.count > 0 && "font-medium"
                        )}>
                          {dayData.payment.count} py
                        </div>
                        <div className="text-2xs font-medium truncate">{formatCurrency(dayData.payment.totalAmount)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

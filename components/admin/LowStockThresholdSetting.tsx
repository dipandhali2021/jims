'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

interface LowStockThresholdSettingProps {
  currentThreshold: number;
  onThresholdUpdated: () => void;
}

export function LowStockThresholdSetting({
  currentThreshold,
  onThresholdUpdated,
}: LowStockThresholdSettingProps) {
  const [threshold, setThreshold] = useState(currentThreshold.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Update threshold state when currentThreshold prop changes
  useEffect(() => {
    setThreshold(currentThreshold.toString());
  }, [currentThreshold]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const thresholdValue = parseInt(threshold);
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      toast({
        title: 'Invalid threshold',
        description: 'Please enter a valid positive number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/settings/low-stock-threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threshold: thresholdValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update threshold');
      }

      toast({
        title: 'Success',
        description: `Low stock threshold set to ${thresholdValue}`,
      });
      
      onThresholdUpdated();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update threshold',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Set low stock threshold">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Low Stock Threshold Setting</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">
                  Products with stock below this value will be marked as low stock
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
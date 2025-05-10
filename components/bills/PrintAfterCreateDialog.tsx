import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bill } from "@/hooks/use-bills";
import { PrintBillButton } from "./PrintBillButton";
import { Printer, Check } from "lucide-react";

interface PrintAfterCreateDialogProps {
  bill: Bill;
  open: boolean;
  onClose: () => void;
}

export function PrintAfterCreateDialog({ bill, open, onClose }: PrintAfterCreateDialogProps) {
  const [billPrinted, setBillPrinted] = useState(false);

  const handlePrintWithStatus = () => {
    // This function will be called inside the PrintBillButton's onClick handler
    // and marks the bill as printed
    setBillPrinted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bill Created Successfully</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Bill Type:</span>
              <span className="font-medium">{bill.billType}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{bill.customerName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{Array.isArray(bill.items) ? bill.items.length : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">₹{bill.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-center mb-4">Would you like to print this bill now?</p>
            
            <div className="flex space-x-4">
              <Button
                variant={billPrinted ? "outline" : "default"}
                onClick={handlePrintWithStatus}
                className="relative"
              > 
                <PrintBillButton 
                  bill={bill} 
                  triggerPrint={true} 
                  onPrint={handlePrintWithStatus} 
                />
                {billPrinted && (
                  <Check className="h-4 w-4 ml-2 text-green-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            {billPrinted ? "Close" : "Skip Printing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

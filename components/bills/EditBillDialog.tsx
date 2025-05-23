import * as React from 'react';
const { useEffect, useState } = React;
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bill, useBills } from '@/hooks/use-bills';
import { Textarea } from '@/components/ui/textarea';
import { BillTabs } from '@/components/bills/BillTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';

interface EditBillDialogProps {
  open: boolean;
  onClose: () => void;
  bill: Bill | null;
  onSuccess: () => void;
}

export function EditBillDialog({
  open,
  onClose,
  bill,
  onSuccess
}: EditBillDialogProps) {  // Extract GST percentages from bill
  const extractGstPercentages = (bill: Bill | null) => {
    try {
      if (bill?.items && typeof bill.items === 'object') {
        const items = bill.items as any;
        if (items._meta) {
          return {
            cgst: items._meta.cgstPercentage?.toString() || '9',
            sgst: items._meta.sgstPercentage?.toString() || '9',
            igst: items._meta.igstPercentage?.toString() || '0'
          };
        }
      }
    } catch (error) {
      console.error('Error parsing GST percentages:', error);
    }
    return { cgst: '9', sgst: '9', igst: '0' }; // Default GST percentages
  };
  console.log('Bill:', bill);
  const gstPercentages = extractGstPercentages(bill);
  const [cgstPercentage, setCgstPercentage] = useState(gstPercentages.cgst);
  const [sgstPercentage, setSgstPercentage] = useState(gstPercentages.sgst);
  const [igstPercentage, setIgstPercentage] = useState(gstPercentages.igst);
  // Initialize with default values from bill prop
  const [isTaxable, setIsTaxable] = useState(bill?.isTaxable !== false);
  const [editedBill, setEditedBill] = useState<Partial<Bill>>({
    customerName: bill?.customerName || '',
    customerAddress: bill?.customerAddress || '',
    customerState: bill?.customerState || '',
    customerGSTIN: bill?.customerGSTIN || '',
    transportMode: bill?.transportMode || '',
    vehicleNo: bill?.vehicleNo || '',
    placeOfSupply: bill?.placeOfSupply || 'Maharashtra',
    billType: bill?.billType || 'GST'
  });
  
  const { updateBill, isLoading } = useBills();
  // Update state when bill prop changes
  useEffect(() => {
    if (bill) {
      const gstPercentages = extractGstPercentages(bill);
      setCgstPercentage(gstPercentages.cgst);
      setSgstPercentage(gstPercentages.sgst);
      setIgstPercentage(gstPercentages.igst);
      setIsTaxable(bill.isTaxable !== false);
      setEditedBill({
        customerName: bill.customerName || '',
        customerAddress: bill.customerAddress || '',
        customerState: bill.customerState || '',
        customerGSTIN: bill.customerGSTIN || '',
        transportMode: bill.transportMode || '',
        vehicleNo: bill.vehicleNo || '',
        placeOfSupply: bill.placeOfSupply || '',
        isTaxable: bill.isTaxable !== false,
      });
    }
  }, [bill]);

  const handleChange = (field: keyof Bill, value: string) => {
    setEditedBill({
      ...editedBill,
      [field]: value
    });
  };  const handleSubmit = async () => {
    if (!bill || !editedBill.customerName) return;
    
    // Update items json to include GST percentages in _meta
    let updatedItems = bill.items;
    try {
      if (typeof bill.items === 'object') {
        const items = { ...bill.items } as any;
        items._meta = {
          ...(items._meta || {}),
          cgstPercentage: isTaxable ? parseFloat(cgstPercentage || '9') : 0,
          sgstPercentage: isTaxable ? parseFloat(sgstPercentage || '9') : 0,
          igstPercentage: isTaxable ? parseFloat(igstPercentage || '0') : 0
        };
        updatedItems = items;
      }
    } catch (error) {
      console.error('Error updating GST percentages:', error);
    }
      const result = await updateBill(bill.id, {
      ...editedBill,
      // Make sure to preserve the items and amounts from the original bill but with updated GST percentage
      items: updatedItems,
      totalAmount: bill.totalAmount,
      sgst: isTaxable ? bill.sgst : 0,
      cgst: isTaxable ? bill.cgst : 0,
      igst: isTaxable ? bill.igst : 0,
      isTaxable: isTaxable,
    });
    
    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Bill #{bill?.billNumber}</DialogTitle>
        </DialogHeader>
        
        <BillTabs defaultValue={bill?.billType === 'GST' ? 'gst' : 'non-gst'}>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={editedBill.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                required
              />
            </div>
            
            <TabsContent value="gst" className="space-y-4 mt-0 p-0">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerGSTIN">Customer GSTIN</Label>
                  <Input
                    id="customerGSTIN"
                    placeholder="Enter customer GSTIN"
                    value={editedBill.customerGSTIN}
                    onChange={(e) => handleChange('customerGSTIN', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply</Label>
                  <Input
                    id="placeOfSupply"
                    placeholder="State"
                    value={editedBill.placeOfSupply}
                    onChange={(e) => handleChange('placeOfSupply', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Textarea
                  id="customerAddress"
                  placeholder="Enter customer address"
                  value={editedBill.customerAddress}
                  onChange={(e) => handleChange('customerAddress', e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerState">Customer State</Label>
                  <Input
                    id="customerState"
                    placeholder="Enter customer state"
                    value={editedBill.customerState}
                    onChange={(e) => handleChange('customerState', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportMode">Transport Mode</Label>
                  <Input
                    id="transportMode"
                    placeholder="By Road, etc."
                    value={editedBill.transportMode}
                    onChange={(e) => handleChange('transportMode', e.target.value)}
                  />
                </div>
              </div>              <div className="space-y-2">
                <Label htmlFor="vehicleNo">Vehicle Number</Label>
                <Input
                  id="vehicleNo"
                  placeholder="Enter vehicle number"
                  value={editedBill.vehicleNo}
                  onChange={(e) => handleChange('vehicleNo', e.target.value)}
                />
              </div>                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    id="isTaxable"
                    checked={isTaxable}
                    onCheckedChange={setIsTaxable}
                  />
                  <Label htmlFor="isTaxable">Tax is payable on Reverse Charge</Label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cgstPercentage">CGST (%)</Label>
                  <Input
                    id="cgstPercentage"
                    placeholder="9"
                    type="number"
                    value={cgstPercentage}
                    onChange={(e) => setCgstPercentage(e.target.value)}
                    disabled={!isTaxable}                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgstPercentage">SGST (%)</Label>
                  <Input
                    id="sgstPercentage"
                    placeholder="9"
                    type="number"
                    value={sgstPercentage}
                    onChange={(e) => setSgstPercentage(e.target.value)}
                    disabled={!isTaxable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="igstPercentage">IGST (%)</Label>
                  <Input
                    id="igstPercentage"
                    placeholder="0"
                    type="number"
                    value={igstPercentage}
                    onChange={(e) => setIgstPercentage(e.target.value)}
                    disabled={!isTaxable}
                  />
                  <p className="text-xs text-muted-foreground">
                    For inter-state transactions
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="non-gst" className="p-0">
              <p className="text-sm text-muted-foreground mb-4">
                Non-GST bill contains customer name and sales items only.
              </p>
            </TabsContent>
            
            {/* Note about items */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Note: Bill items cannot be edited. To change items, please delete this bill and create a new one.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !editedBill.customerName}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Update Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </BillTabs>
      </DialogContent>
    </Dialog>
  );
}

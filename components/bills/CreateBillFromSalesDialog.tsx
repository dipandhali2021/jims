import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillTabs } from "@/components/bills/BillTabs";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBills, Bill, BillItem } from "@/hooks/use-bills";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CreateBillFromSalesDialogProps {
  open: boolean;
  onClose: () => void;
  salesRequest: any;
  onSuccess: () => void;
}

export function CreateBillFromSalesDialog({
  open,
  onClose,
  salesRequest,
  onSuccess
}: CreateBillFromSalesDialogProps) {  const [billType, setBillType] = useState<"gst" | "non-gst">("gst");
  const [customerGSTIN, setCustomerGSTIN] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Maharashtra");
  const [isTaxable, setIsTaxable] = useState(true); // Default to true for GST bills
  // Separate GST percentage fields
  const [cgstPercentage, setCgstPercentage] = useState("9"); // Default 9%
  const [sgstPercentage, setSgstPercentage] = useState("9"); // Default 9%
  const [igstPercentage, setIgstPercentage] = useState("0"); // Default 0% for intra-state
  const [hsnCode, setHsnCode] = useState("7113"); // Default HSN code for jewelry
  const [dateOfSupply, setDateOfSupply] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeOfSupply, setTimeOfSupply] = useState(format(new Date(), "HH:mm"));

  const { createBill, isLoading } = useBills();
  const { toast } = useToast();  const handleCreateBill = async () => {
    if (!salesRequest) return;
    
    // Parse GST percentages
    const cgstRate = parseFloat(cgstPercentage) / 100;
    const sgstRate = parseFloat(sgstPercentage) / 100;
    const igstRate = parseFloat(igstPercentage) / 100;
    
    // Convert sales items to bill items
    const billItems: BillItem[] = salesRequest.items.map((item: any) => ({
      name: item.product?.name || item.productName || "Unknown Product",
      quantity: item.quantity,
      rate: item.price,
      amount: item.price * item.quantity,
      hsn: billType === "gst" ? hsnCode : undefined,
    }));
    
    const totalAmount = salesRequest.totalValue;
    let sgst, cgst, igst;
      if (billType === "gst" && isTaxable) {
      // Calculate GST components using the user-provided percentages
      cgst = totalAmount * cgstRate;
      sgst = totalAmount * sgstRate;
      igst = totalAmount * igstRate;
    } else {
      // No tax calculation if not taxable, regardless of bill type
      cgst = 0;
      sgst = 0;
      igst = 0;
    }
    
    // Format date and time of supply
    const supplyDateTime = dateOfSupply && timeOfSupply 
      ? `${dateOfSupply}T${timeOfSupply}:00` 
      : new Date().toISOString();
    
    try {
      // For GST bill, we need to include all the GST-related fields
      // This will be combined with the sales request approval
      const response = await fetch(`/api/sales-requests/${salesRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'Approved', 
          billType: billType === "gst" ? "GST" : "Non-GST",
          billDetails: {
            customerGSTIN: billType === "gst" ? customerGSTIN : undefined,
            customerAddress: billType === "gst" ? customerAddress : undefined,
            customerState: billType === "gst" ? customerState : undefined,
            transportMode: billType === "gst" ? transportMode : undefined,
            vehicleNo: billType === "gst" ? vehicleNo : undefined,
            placeOfSupply: billType === "gst" ? placeOfSupply : undefined,
            hsnCode: billType === "gst" ? hsnCode : undefined,
            isTaxable: billType === "gst" ? isTaxable : false,
            cgstPercentage: billType === "gst" && isTaxable ? parseFloat(cgstPercentage) : 0,
            sgstPercentage: billType === "gst" && isTaxable ? parseFloat(sgstPercentage) : 0,
            igstPercentage: billType === "gst" && isTaxable ? parseFloat(igstPercentage) : 0,
            supplyDateTime: supplyDateTime
          }
        }),
      });
        if (!response.ok) {
        throw new Error("Failed to approve request and create bill");
      }
      
      // First call onSuccess to signal successful completion to the parent component
      onSuccess();
      
      // After notifying parent about success, close the dialog
      // We wrap this in setTimeout(0) to ensure the parent component's state updates
      // have a chance to execute before this dialog tries to close itself
      setTimeout(() => {
        onClose();
      }, 0);
      
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        title: "Error",
        description: "Failed to create bill",
        variant: "destructive",
      });
    }
  };
  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Bill for Sales Request #{salesRequest?.requestId}</DialogTitle>
        </DialogHeader>
        
        <BillTabs onValueChange={(v) => setBillType(v as "gst" | "non-gst")}>          <TabsContent value="gst" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerGSTIN">Customer GSTIN</Label>
                  <Input
                    id="customerGSTIN"
                    placeholder="Enter customer GSTIN"
                    value={customerGSTIN}
                    onChange={(e) => setCustomerGSTIN(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply</Label>
                  <Input
                    id="placeOfSupply"
                    placeholder="State"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Input
                  id="customerAddress"
                  placeholder="Enter customer address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerState">Customer State</Label>
                  <Input
                    id="customerState"
                    placeholder="Enter customer state"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportMode">Transport Mode</Label>
                  <Input
                    id="transportMode"
                    placeholder="By Road, etc."
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNo">Vehicle Number</Label>
                  <Input
                    id="vehicleNo"
                    placeholder="Enter vehicle number"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN Code</Label>
                  <Input
                    id="hsnCode"
                    placeholder="HSN code for jewelry"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                  />
                </div>
              </div>                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    id="isTaxable"
                    checked={isTaxable}
                    onCheckedChange={setIsTaxable}
                  />
                  <Label htmlFor="isTaxable">Bill is Taxable (Include GST)</Label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cgstPercentage">CGST (%)</Label>
                  <Input
                    id="cgstPercentage"
                    disabled={!isTaxable}
                    type="number"
                    placeholder="CGST percentage"
                    value={cgstPercentage}
                    onChange={(e) => setCgstPercentage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgstPercentage">SGST (%)</Label>
                  <Input
                    id="sgstPercentage"
                    type="number"
                    placeholder="SGST percentage"
                    value={sgstPercentage}
                    onChange={(e) => setSgstPercentage(e.target.value)}
                    disabled={!isTaxable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="igstPercentage">IGST (%)</Label>
                  <Input
                    id="igstPercentage"
                    type="number"
                    placeholder="IGST percentage"
                    value={igstPercentage}
                    onChange={(e) => setIgstPercentage(e.target.value)}
                    disabled={!isTaxable}
                  />
                  <p className="text-xs text-muted-foreground">For inter-state transactions</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dateOfSupply">Date of Supply</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dateOfSupply"
                      type="date"
                      className="pl-10"
                      value={dateOfSupply}
                      onChange={(e) => setDateOfSupply(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeOfSupply">Time of Supply</Label>
                  <Input
                    id="timeOfSupply"
                    type="time"
                    value={timeOfSupply}
                    onChange={(e) => setTimeOfSupply(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="non-gst" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Non-GST bill will be created with basic customer information only.
            </p>
          </TabsContent>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateBill} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                `Create ${billType === "gst" ? "GST" : "Non-GST"} Bill`
              )}
            </Button>
          </div>
        </BillTabs>
      </DialogContent>
    </Dialog>
  );
}

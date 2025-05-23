import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BillTabs } from '@/components/bills/BillTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useBills, Bill, BillItem } from '@/hooks/use-bills';
import { useProducts, Product } from '@/hooks/use-products';
import { Loader2, Plus, Trash2, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

interface CreateManualBillDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (bill?: Bill) => void;
}

export function CreateManualBillDialog({
  open,
  onClose,
  onSuccess,
}: CreateManualBillDialogProps) {
  // Always initialize with GST bill type and force BillTabs to show GST tab
  const [billType, setBillType] = useState<'gst' | 'non-gst'>('gst');
  
  // Reset bill type to GST when dialog opens
  useEffect(() => {
    if (open) {
      setBillType('gst');
    }
  }, [open]);
  const [customerName, setCustomerName] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra');
  const [isTaxable, setIsTaxable] = useState(true); // Default to true for GST bills
  // Separate GST percentage fields
  const [cgstPercentage, setCgstPercentage] = useState('9'); // Default 9%
  const [sgstPercentage, setSgstPercentage] = useState('9'); // Default 9%
  const [igstPercentage, setIgstPercentage] = useState('0'); // Default 0% for intra-state
  const [dateOfSupply, setDateOfSupply] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [timeOfSupply, setTimeOfSupply] = useState(format(new Date(), 'HH:mm'));
  const [items, setItems] = useState<
    Array<{
      name: string;
      quantity: number;
      rate: number;
      hsn?: string;
      productId?: string;
    }>
  >([
    {
      name: '',
      quantity: 1,
      rate: 0,
      hsn: billType === 'gst' ? '7113' : undefined,
    },
  ]);

  // Product search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showProductSearch, setShowProductSearch] = useState<boolean>(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(
    null
  );

  const { products, isLoading: productsLoading } = useProducts();
  const { createBill, isLoading } = useBills();

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: '',
        quantity: 1,
        rate: 0,
        hsn: billType === 'gst' ? '7113' : undefined,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'rate' ? Number(value) : value,
    };
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.rate, 0);
  };

  const handleOpenProductSearch = (index: number) => {
    setCurrentEditingIndex(index);
    setSearchTerm('');
    setShowProductSearch(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (currentEditingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[currentEditingIndex] = {
        name: product.name,
        quantity: 1,
        rate: product.price,
        hsn: billType === 'gst' ? '7113' : undefined,
        productId: product.id,
      };
      setItems(updatedItems);
      setShowProductSearch(false);
      setCurrentEditingIndex(null);
      setSearchTerm('');
    }
  };

  const handleCreateBill = async () => {
    if (!customerName) {
      return;
    }

    // Parse GST percentages
    const cgstRate = parseFloat(cgstPercentage) / 100;
    const sgstRate = parseFloat(sgstPercentage) / 100;
    const igstRate = parseFloat(igstPercentage) / 100;

    // Convert items to bill items
    const billItems: BillItem[] = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
      hsn: billType === 'gst' ? item.hsn : undefined,
    }));

    const totalAmount = calculateTotal();
    let sgst, cgst, igst;

    if (billType === 'gst') {
      // Calculate GST components using user-defined percentages
      cgst = totalAmount * cgstRate;
      sgst = totalAmount * sgstRate;
      igst = totalAmount * igstRate;
    }

    // Format date and time of supply
    const supplyDateTime =
      dateOfSupply && timeOfSupply
        ? new Date(`${dateOfSupply}T${timeOfSupply}:00`)
        : new Date();

    // Store HSN codes as JSON if needed
    const hsnCodes =
      billType === 'gst'
        ? items.reduce(
            (acc, item, index) => ({ ...acc, [index]: item.hsn }),
            {}
          )
        : undefined;

    const billData: Partial<Bill> = {
      billType: billType === 'gst' ? 'GST' : 'Non-GST',
      customerName,
      customerAddress: billType === 'gst' ? customerAddress : undefined,
      customerState: billType === 'gst' ? customerState : undefined,
      customerGSTIN: billType === 'gst' ? customerGSTIN : undefined,
      items: billItems,
      totalAmount:
        billType === 'gst'
          ? totalAmount + (sgst || 0) + (cgst || 0) + (igst || 0)
          : totalAmount,

      cgst: cgst,
      igst: igst,
      sgst: sgst,
      hsnCodes,
      transportMode: billType === 'gst' ? transportMode : undefined,
      vehicleNo: billType === 'gst' ? vehicleNo : undefined,
      placeOfSupply: billType === 'gst' ? placeOfSupply : undefined,
      isTaxable: billType === 'gst' ? isTaxable : false,
      date: supplyDateTime.toISOString(), // Use the date of supply as ISO string
      isFakeBill: true, // Mark as fake bill
    };

    // Add custom fields to the API call but not to the Bill type
    const apiData = {
      ...billData,
      // These fields will be processed by the API but aren't part of the Bill type
      dateOfSupply,
      timeOfSupply,
      cgstPercentage: parseFloat(cgstPercentage),
      sgstPercentage: parseFloat(sgstPercentage),
      igstPercentage: parseFloat(igstPercentage),
      hsnCode: billType === 'gst' ? items[0]?.hsn || '7113' : undefined,
    };

    const result = await createBill(apiData);
    if (result) {
      onSuccess(result);
      resetFormAndClose();
    }
  };

  const isFormValid = () => {
    // Basic validation for all bill types
    if (!customerName) return false;
    if (items.length === 0) return false;
    if (!items.every((item) => item.name && item.rate > 0)) return false;
    
    // Additional validation for GST bills
    if (billType === 'gst') {
      if (!customerState || !customerAddress) return false;
    }
    
    return true;
  };
  // Don't reset the bill type when form is reset
  const resetForm = () => {
    const currentBillType = billType; // Preserve current bill type
    setCustomerName("");
    setCustomerGSTIN("");
    setCustomerAddress("");
    setCustomerState("");
    setTransportMode("");
    setVehicleNo("");
    setPlaceOfSupply("Maharashtra");
    setIsTaxable(true);
    setCgstPercentage("9");
    setSgstPercentage("9");
    setIgstPercentage("0");
    setDateOfSupply(format(new Date(), "yyyy-MM-dd"));
    setTimeOfSupply(format(new Date(), "HH:mm"));
    setItems([{ name: "", quantity: 1, rate: 0, hsn: currentBillType === "gst" ? "7113" : undefined }]);
  };

  const resetFormAndClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetFormAndClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full md:max-w-[1200px] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Create Manual Bill</DialogTitle>
        </DialogHeader>

        <BillTabs value={billType} onValueChange={(v) => setBillType(v as 'gst' | 'non-gst')}>
          <div className="py-3">
            {/* Customer Basic Information - Always Visible */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="w-full md:w-[250px]">
                <Label htmlFor="customerName">Customer Name*</Label>
                <Input
                  id="customerName"
                  placeholder="Enter name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              
              {/* GST Information */}
              <TabsContent value="gst" className="flex-1 p-0 m-0">
                <div className="flex flex-wrap gap-3">
                  <div className="w-full md:w-[200px]">
                    <Label htmlFor="customerGSTIN">Customer GSTIN</Label>
                    <Input
                      id="customerGSTIN"
                      placeholder="Enter GSTIN"
                      value={customerGSTIN}
                      onChange={(e) => setCustomerGSTIN(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Label htmlFor="placeOfSupply">Place of Supply</Label>
                    <Input
                      id="placeOfSupply"
                      placeholder="State"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Label htmlFor="customerState">Customer State</Label>
                    <Input
                      id="customerState"
                      placeholder="Enter state"
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Label htmlFor="transportMode">Transport Mode</Label>
                    <Input
                      id="transportMode"
                      placeholder="By Road, etc."
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="w-full md:w-[250px]">
                    <Label htmlFor="customerAddress">Customer Address</Label>
                    <Input
                      id="customerAddress"
                      placeholder="Enter address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Label htmlFor="vehicleNo">Vehicle Number</Label>
                    <Input
                      id="vehicleNo"
                      placeholder="Enter vehicle no."
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="non-gst" className="p-0 m-0">
                <p className="text-sm text-muted-foreground">
                  Non-GST bill will be created with basic customer information
                  only.
                </p>
              </TabsContent>
            </div>

            {/* GST Tax Information */}
            {billType === 'gst' && (
              <div className="border-t py-3 mb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isTaxable"
                      checked={isTaxable}
                      onCheckedChange={setIsTaxable}
                    />
                    <Label htmlFor="isTaxable">
                      Tax is payable on Reverse Charge
                    </Label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="w-[80px]">
                      <Label htmlFor="cgstPercentage" className="text-xs">
                        CGST (%)
                      </Label>
                      <Input
                        id="cgstPercentage"
                        type="number"
                        value={cgstPercentage}
                        onChange={(e) => setCgstPercentage(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="w-[80px]">
                      <Label htmlFor="sgstPercentage" className="text-xs">
                        SGST (%)
                      </Label>
                      <Input
                        id="sgstPercentage"
                        type="number"
                        value={sgstPercentage}
                        onChange={(e) => setSgstPercentage(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="w-[80px]">
                      <Label htmlFor="igstPercentage" className="text-xs">
                        IGST (%)
                      </Label>
                      <Input
                        id="igstPercentage"
                        type="number"
                        value={igstPercentage}
                        onChange={(e) => setIgstPercentage(e.target.value)}
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        For inter-state
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 ml-auto">
                    <div className="w-[140px]">
                      <Label htmlFor="dateOfSupply" className="text-xs">
                        Date of Supply
                      </Label>
                      <Input
                        id="dateOfSupply"
                        type="date"
                        value={dateOfSupply}
                        onChange={(e) => setDateOfSupply(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="w-[120px]">
                      <Label htmlFor="timeOfSupply" className="text-xs">
                        Time of Supply
                      </Label>
                      <Input
                        id="timeOfSupply"
                        type="time"
                        value={timeOfSupply}
                        onChange={(e) => setTimeOfSupply(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Bill Items*</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-md bg-gray-50/50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Item #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label
                            htmlFor={`item-name-${index}`}
                            className="text-xs"
                          >
                            Name*
                          </Label>
                          <Input
                            id={`item-name-${index}`}
                            value={item.name}
                            placeholder="Item name"
                            onChange={(e) =>
                              handleItemChange(index, 'name', e.target.value)
                            }
                            className="h-8"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenProductSearch(index)}
                          className="whitespace-nowrap h-8"
                        >
                          <Search className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor={`item-qty-${index}`}
                            className="text-xs"
                          >
                            Qty*
                          </Label>
                          <Input
                            id={`item-qty-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'quantity',
                                e.target.value
                              )
                            }
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`item-rate-${index}`}
                            className="text-xs"
                          >
                            Rate (₹)*
                          </Label>
                          <Input
                            id={`item-rate-${index}`}
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(index, 'rate', e.target.value)
                            }
                            className="h-8"
                          />
                        </div>
                      </div>

                      {billType === 'gst' && (
                        <div>
                          <Label
                            htmlFor={`item-hsn-${index}`}
                            className="text-xs"
                          >
                            HSN Code
                          </Label>
                          <Input
                            id={`item-hsn-${index}`}
                            value={item.hsn || ''}
                            placeholder="7113"
                            onChange={(e) =>
                              handleItemChange(index, 'hsn', e.target.value)
                            }
                            className="h-8"
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-right mt-2 text-xs">
                      <span className="text-muted-foreground">Subtotal: </span>
                      <span className="font-medium">
                        ₹{(item.quantity * item.rate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary */}
              <div className="flex justify-end pt-3 mt-3">
                <div className="bg-muted p-3 rounded w-64">
                  <div className="flex justify-between mb-1">
                    <span>Total:</span>
                    <span className="font-medium">
                      ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  {billType === 'gst' && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>CGST ({parseFloat(cgstPercentage)}%):</span>
                        <span>
                          ₹
                          {(
                            (calculateTotal() * parseFloat(cgstPercentage)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>SGST ({parseFloat(sgstPercentage)}%):</span>
                        <span>
                          ₹
                          {(
                            (calculateTotal() * parseFloat(sgstPercentage)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>IGST ({parseFloat(igstPercentage)}%):</span>
                        <span>
                          ₹
                          {(
                            (calculateTotal() * parseFloat(igstPercentage)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>Grand Total:</span>
                        <span>
                          ₹
                          {(
                            calculateTotal() *
                            (1 +
                              (parseFloat(cgstPercentage) +
                                parseFloat(sgstPercentage) +
                                parseFloat(igstPercentage)) /
                                100)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Product Search Modal */}
              {showProductSearch && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">
                      Select Product
                    </h2>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {productsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 flex items-center"
                            onClick={() => handleSelectProduct(product)}
                          >
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded mr-3"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Product ID: {product.sku}
                              </div>
                              <div className="text-sm">
                                ₹{product.price.toLocaleString()} | Stock:{' '}
                                {product.stock}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No products found
                      </p>
                    )}

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowProductSearch(false);
                          setCurrentEditingIndex(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={resetFormAndClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBill}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                `Create ${billType === 'gst' ? 'GST' : 'Non-GST'} Bill`
              )}
            </Button>
          </div>
        </BillTabs>
      </DialogContent>
    </Dialog>
  );
}

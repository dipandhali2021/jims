'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Loader2, Plus, Minus, X } from 'lucide-react';
import { Product } from '@/hooks/use-products';

interface CreateBulkSalesRequestDialogProps {
  products: Product[];
  onRequestCreated: () => void;
}

interface ProductSelection {
  product: Product;
  quantity: number;
}

export function CreateBulkSalesRequestDialog({
  products,
  onRequestCreated,
}: CreateBulkSalesRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);
  const [filteredProductOptions, setFilteredProductOptions] = useState<Product[]>(products);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Update filtered products when search term changes
  useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      p => p.name.toLowerCase().includes(term) ||
           p.sku.toLowerCase().includes(term)
    );
    setFilteredProductOptions(filtered);
  }, [searchTerm, products]);

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.product.id === product.id);
    if (!existing) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const removeProduct = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    setSelectedProducts(newProducts);
  };

  const updateProductSelection = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newProducts = [...selectedProducts];
    newProducts[index] = { ...newProducts[index], product };
    setSelectedProducts(newProducts);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index] = { ...newProducts[index], quantity };
    setSelectedProducts(newProducts);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, { product, quantity }) => {
      return total + (product.price * quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter customer name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product',
        variant: 'destructive',
      });
      return;
    }

    // Validate quantities
    for (const { product, quantity } of selectedProducts) {
      if (quantity < 1 || quantity > product.stock) {
        toast({
          title: 'Error',
          description: `Quantity for ${product.name} must be between 1 and ${product.stock}`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/sales-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerName,
          items: selectedProducts.map(({ product, quantity }) => ({
            productId: product.id,
            quantity: quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sales request');
      }

      toast({
        title: 'Success',
        description: 'Bulk sales request created successfully',
      });

      onRequestCreated();
      setIsOpen(false);
      setCustomerName('');
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error creating sales request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create sales request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Bulk Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-white border-0 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">Create Bulk Sales Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Responsive grid - stacks on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Customer Details & Product Search - Top section on mobile */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={searchTerm}
                    placeholder="Search by name or Product ID..."
                    className="w-full pl-10 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="mt-2 border rounded-md max-h-[250px] md:max-h-[400px] overflow-y-auto">
                  {filteredProductOptions.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
                      onClick={() => addProduct(product)}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                        Product ID: {product.sku}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">
                          ₹{product.price.toLocaleString()}
                          </span>
                          <span className={`text-sm ${product.stock < (product.lowStockThreshold || 10) ? 'text-red-500' : 'text-green-500'}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Products & Summary - Bottom section on mobile */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-sm font-medium text-gray-700">Selected Products</Label>
                  {selectedProducts.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'}
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[250px] md:max-h-[400px] overflow-y-auto">
                  {selectedProducts.map(({ product, quantity }, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="text-sm text-gray-500">Product ID: {product.sku}</div>
                          <div className="text-sm font-medium">
                          ₹{product.price.toLocaleString()} per unit
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, Math.max(1, quantity - 1))}
                            className="px-2"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, Math.min(product.stock, quantity + 1))}
                            className="px-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="text-red-500 hover:text-red-700 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right text-sm font-medium">
                          Total: ₹{(product.price * quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProducts.length > 0 ? (
                <div className="bg-gray-500 text-white p-4 rounded-lg">
                  <div className="text-lg">Order Summary</div>
                  <div className="text-2xl">
                    Total: ₹{calculateTotal().toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-4 border rounded-lg">
                  No products selected. Use the search to add products.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedProducts.length === 0}
              className="px-4 bg-black text-white hover:bg-gray-900"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Edit, Upload, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '@/hooks/use-products';

const categories = [
  'Rings',
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Watches',
  'Pendants',
  'Other',
];

const materials = [
  'Gold',
  'Silver',
  'Platinum',
  'Diamond',
  'Pearl',
  'White Gold',
  'Stainless Steel',
  'Other',
];

interface EditProductRequestDialogProps {
  product: Product;
  onRequestCreated: () => void;
}

export function EditProductRequestDialog({
  product,
  onRequestCreated,
}: EditProductRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<string>('0');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Determine if product has custom category or material
  const isCustomCategory = !categories.includes(product.category);
  const isCustomMaterial = !materials.includes(product.material);

  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    category: isCustomCategory ? 'Other' : product.category,
    material: isCustomMaterial ? 'Other' : product.material,
    customCategory: isCustomCategory ? product.category : '',
    customMaterial: isCustomMaterial ? product.material : '',
    price: product?.price?.toString() || '',
    stock: product?.stock?.toString() || '',
    supplier: product?.supplier || '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);

  // Reset form data when product changes
  useEffect(() => {
    if (product) {
      // Determine if product has custom category or material
      const isCustomCategory = !categories.includes(product.category);
      const isCustomMaterial = !materials.includes(product.material);

      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: isCustomCategory ? 'Other' : product.category,
        material: isCustomMaterial ? 'Other' : product.material,
        customCategory: isCustomCategory ? product.category : '',
        customMaterial: isCustomMaterial ? product.material : '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        supplier: product.supplier || '',
      });
      setImagePreview(product.imageUrl || null);
      setRemoveImage(false);
      setImage(null);
      setStockAdjustment('0');
      setError(null);
      setShowAdvancedOptions(false);
    }
  }, [product]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      processSelectedFile(file);
    }
  };
  
  // Process the selected file
  const processSelectedFile = (file: File) => {
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 10MB',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive',
      });
      return;
    }
    
    setImage(file);
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag enter event
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    
    // Reset the file input to ensure it can accept new files after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    // Determine if product has custom category or material
    const isCustomCategory = !categories.includes(product.category);
    const isCustomMaterial = !materials.includes(product.material);

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      category: isCustomCategory ? 'Other' : product.category,
      material: isCustomMaterial ? 'Other' : product.material,
      customCategory: isCustomCategory ? product.category : '',
      customMaterial: isCustomMaterial ? product.material : '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      supplier: product.supplier || '',
    });
    setImagePreview(product.imageUrl || null);
    setRemoveImage(false);
    setImage(null);
    setStockAdjustment('0');
    setError(null);
    setShowAdvancedOptions(false);
  };

  // Calculate new stock based on current stock and adjustment
  const calculateNewStock = (): number => {
    const currentStock = parseInt(formData.stock);
    const adjustment = parseInt(stockAdjustment || '0');
    return currentStock + adjustment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.sku.trim()) {
      setError('Product ID is required');
      toast({
        title: 'Error',
        description: 'Product ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      setError("Custom category is required when 'Other' is selected");
      toast({
        title: 'Error',
        description: "Please enter a custom category name",
        variant: 'destructive',
      });
      return;
    }

    if (!formData.material) {
      setError('Material is required');
      toast({
        title: 'Error',
        description: 'Please select a material',
        variant: 'destructive',
      });
      return;
    }

    if (formData.material === 'Other' && !formData.customMaterial.trim()) {
      setError("Custom material is required when 'Other' is selected");
      toast({
        title: 'Error',
        description: "Please enter a custom material name",
        variant: 'destructive',
      });
      return;
    }

    // Price and stock validation
    const priceValue = parseFloat(formData.price);
    const stockAdjustmentValue = parseInt(stockAdjustment);
    const newStock = calculateNewStock();

    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Valid price is required');
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    if (newStock < 0) {
      setError('Stock cannot be negative');
      toast({
        title: 'Error',
        description: 'Stock adjustment would result in negative stock',
        variant: 'destructive',
      });
      return;
    }

    // Check if anything changed
    const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
    const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;

    const isUnchanged = 
      formData.name === product.name &&
      formData.sku === product.sku &&
      formData.description === (product.description || '') &&
      finalCategory === product.category &&
      finalMaterial === product.material &&
      parseFloat(formData.price) === product.price &&
      stockAdjustmentValue === 0 &&
      formData.supplier === (product.supplier || '') &&
      !image &&
      !removeImage;

    if (isUnchanged) {
      toast({
        title: 'No changes',
        description: 'You need to make changes to request an update',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create form data for API request
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('requestType', 'edit');
      formDataToSubmit.append('productId', product.id);
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('sku', formData.sku);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('category', finalCategory);
      formDataToSubmit.append('material', finalMaterial);
      formDataToSubmit.append('price', formData.price);
      formDataToSubmit.append('stock', newStock.toString());
      formDataToSubmit.append('stockAdjustment', stockAdjustment);
      formDataToSubmit.append('removeImage', removeImage.toString());
      
      if (formData.supplier) {
        formDataToSubmit.append('supplier', formData.supplier);
      }

      if (image) {
        formDataToSubmit.append('image', image);
      } else if (product.imageUrl && !removeImage) {
        formDataToSubmit.append('imageUrl', product.imageUrl);
      }

      // Send request to API
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create edit product request');
      }

      toast({
        title: 'Success',
        description: 'Product edit request submitted. Waiting for admin approval.',
      });

      setIsOpen(false);
      onRequestCreated();
    } catch (error) {
      console.error('Error creating product edit request:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product edit request');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product edit request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
      >
        <Edit className="h-4 w-4" />
        <span className="sr-only">Request Edit</span>
      </Button>
      <DialogContent className="sm:max-w-[600px] p-0 bg-white rounded-lg shadow-lg border-0 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">Request to Edit Product</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Quick Edit Section - Always visible */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stock Update</h3>
            <div className="grid grid-cols-2 gap-4 justify-center items-center">
              <div className="space-y-2">
                <Label htmlFor="stockAdjustment" className="text-sm font-medium">
                  Stock Adjustment
                </Label>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    Current Stock: <span className="font-medium">{formData.stock}</span>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="stockAdjustment"
                      type="number"
                      value={stockAdjustment}
                      onChange={(e) => setStockAdjustment(e.target.value)}
                      className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                      placeholder="Add or remove stock"
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    New Stock: <span className="font-medium">{calculateNewStock()}</span>
                    {calculateNewStock() < 0 && (
                      <span className="text-red-500 ml-2">Cannot be negative</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
          </div>
        </div>

        <form id="edit-product-request-form" onSubmit={handleSubmit} className="px-6 py-4">
          {/* Advanced Options Section - Toggle */}
          <button
            type="button"
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 mb-4 hover:text-gray-900"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <span>Advanced Options</span>
            {showAdvancedOptions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Advanced Options - Conditionally rendered */}
          {showAdvancedOptions && (
            <div className="space-y-5 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku" className="font-medium">
                    Product ID *
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="min-h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.category === 'Other' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter custom category"
                        value={formData.customCategory}
                        onChange={(e) =>
                          setFormData({ ...formData, customCategory: e.target.value })
                        }
                        className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material" className="font-medium">
                    Material *
                  </Label>
                  <Select
                    value={formData.material}
                    onValueChange={(value) =>
                      setFormData({ ...formData, material: value })
                    }
                  >
                    <SelectTrigger className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.material === 'Other' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter custom material"
                        value={formData.customMaterial}
                        onChange={(e) =>
                          setFormData({ ...formData, customMaterial: e.target.value })
                        }
                        className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="font-medium">
                  Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Product Image</Label>
                <div 
                  ref={dropZoneRef}
                  className={`border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'} rounded-lg p-4 transition-colors duration-200`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {imagePreview && !removeImage ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-h-36 rounded object-contain"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 bg-white rounded-full shadow-sm hover:bg-gray-100"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="request-image-upload-edit"
                      />
                      <label
                        htmlFor="request-image-upload-edit"
                        className="cursor-pointer flex flex-col items-center py-4 w-full"
                      >
                        <Upload className="h-8 w-8 mb-2 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 mb-1">
                          {removeImage ? 'Image removed. Click to upload or drag a new image' : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG up to 10MB
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Move buttons to bottom */}
          <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
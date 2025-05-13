'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import { useAdminProductActions } from '@/hooks/use-admin-product-actions';

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

export function AddProductDialog({onProductAdded}: {onProductAdded: () => Promise<void>}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { trackProductCreation } = useAdminProductActions();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    material: '',
    customCategory: '',
    customMaterial: '',
    price: '',
    stock: '',
    supplier: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      material: '',
      customCategory: '',
      customMaterial: '',
      price: '',
      stock: '',
      supplier: '',
    });
    setImageFile(null);
    setPreviewUrl('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Form validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.sku.trim()) {
      setError("Product ID is required");
      toast({
        title: 'Error',
        description: 'Product ID is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.category) {
      setError("Category is required");
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
      setError("Material is required");
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
    
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setError("Valid price is required");
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      setError("Valid stock quantity is required");
      toast({
        title: 'Error',
        description: 'Please enter a valid stock quantity',
        variant: 'destructive',
      });
      return;
    }

    try {
      const DEFAULT_IMAGE_URL = "https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png";
      setIsLoading(true);
      
      const requestOptions: RequestInit = {
        method: 'POST'
      };

      // Prepare data with custom category/material if "Other" is selected
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;

      // Clone formData without custom fields
      const { customCategory, customMaterial, ...dataToSend } = formData;
      
      // Override category and material with final values
      dataToSend.category = finalCategory;
      dataToSend.material = finalMaterial;

      // If there's an image file, use FormData
      if (imageFile) {
        const data = new FormData();
        Object.entries(dataToSend).forEach(([key, value]) => {
          data.append(key, value);
        });
        data.append('image', imageFile);
        requestOptions.body = data;
      } else {
        // If no image, send as JSON with default imageUrl
        requestOptions.headers = {
          'Content-Type': 'application/json'
        };
        requestOptions.body = JSON.stringify({
          ...dataToSend,
          imageUrl: DEFAULT_IMAGE_URL
        });
      }

      console.log('Submitting product data');
        // Instead of directly creating the product, create a product request
      const productDetails = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || '',
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: finalCategory,
        material: finalMaterial,
        supplier: formData.supplier || undefined
      };

      // If there's an image file, use FormData for the product request
      let productRequestOptions: RequestInit;
      if (imageFile) {
        const data = new FormData();
        data.append('requestType', 'add');
        data.append('details', JSON.stringify(productDetails));
        data.append('image', imageFile);
        data.append('adminAction', 'true');
        
        productRequestOptions = {
          method: 'POST',
          body: data
        };
      } else {
        // If no image, send as JSON with default imageUrl
        productRequestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestType: 'add',
            details: {
              ...productDetails,
              imageUrl: DEFAULT_IMAGE_URL
            },
            adminAction: true
          })
        };
      }
      
      // Send the request to create a product request
      const response = await fetch('/api/product-requests', productRequestOptions);
      
      // Parse the response as JSON
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product request');
      }      // Call the callback to refresh products
      await onProductAdded();

      // Show success toast
      toast({
        title: 'Success',
        description: 'Product request created successfully. Please approve it in the Product Requests page.',
      });      // Close the dialog and reset form
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Set error message and show toast
      const errorMessage = error.message || 'Failed to create product';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-6 bg-white rounded-lg shadow-lg border-0 overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Add New Product</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Product Name *</Label>
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
              <Label htmlFor="sku" className="font-medium">Product ID *</Label>
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
            <Label htmlFor="description" className="font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="min-h-10  border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-medium">Category *</Label>
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
              <Label htmlFor="material" className="font-medium">Material *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="font-medium">Price (₹) *</Label>
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
              <Label htmlFor="stock" className="font-medium">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier" className="font-medium">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
              placeholder="Enter supplier name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Product Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mx-auto max-h-48 rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 bg-white rounded-full shadow-sm hover:bg-gray-100"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile) {
                      // Check file size (limit to 10MB)
                      if (droppedFile.size > 10 * 1024 * 1024) {
                        toast({
                          title: 'Error',
                          description: 'Image size should be less than 10MB',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      // Check file type
                      if (!droppedFile.type.startsWith('image/')) {
                        toast({
                          title: 'Error',
                          description: 'Please drop a valid image file',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      setImageFile(droppedFile);
                      setPreviewUrl(URL.createObjectURL(droppedFile));
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center py-6"
                  >
                    <Upload className="h-10 w-10 mb-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG up to 10MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="border border-gray-300 hover:bg-gray-50"
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
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
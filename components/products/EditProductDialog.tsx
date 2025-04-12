'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { PenSquare, Upload, X, Loader2 } from 'lucide-react';
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

interface EditProductDialogProps {
  product: Product;
  onProductUpdated: () => Promise<void>;
}

export function EditProductDialog({
  product,
  onProductUpdated,
}: EditProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Determine if product has custom category or material
  const isCustomCategory = !categories.includes(product.category);
  const isCustomMaterial = !materials.includes(product.material);

  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    category: isCustomCategory ? 'Other' : product.category,
    material: isCustomMaterial ? 'Other' : product.material,
    customCategory: isCustomCategory ? product.category : '',
    customMaterial: isCustomMaterial ? product.material : '',
    price: product.price.toString(),
    stock: product.stock.toString(),
  });

  useEffect(() => {
    // Determine if product has custom category or material
    const isCustomCategory = !categories.includes(product.category);
    const isCustomMaterial = !materials.includes(product.material);
    
    // Reset form data when product changes
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: isCustomCategory ? 'Other' : product.category,
      material: isCustomMaterial ? 'Other' : product.material,
      customCategory: isCustomCategory ? product.category : '',
      customMaterial: isCustomMaterial ? product.material : '',
      price: product.price.toString(),
      stock: product.stock.toString(),
    });

    setPreviewUrl(product.imageUrl);
    setImageFile(null);
    setRemoveImage(false);
    setError(null);
  }, [product]);

  const resetForm = () => {
    // Determine if product has custom category or material
    const isCustomCategory = !categories.includes(product.category);
    const isCustomMaterial = !materials.includes(product.material);
    
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: isCustomCategory ? 'Other' : product.category,
      material: isCustomMaterial ? 'Other' : product.material,
      customCategory: isCustomCategory ? product.category : '',
      customMaterial: isCustomMaterial ? product.material : '',
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    
    // Reset image state
    if (previewUrl && previewUrl !== product.imageUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(product.imageUrl);
    setRemoveImage(false);
    setError(null);
  };

  // Handle file input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke any existing object URL to prevent memory leaks
      if (previewUrl && previewUrl !== product.imageUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Create a preview URL for the new file
      const url = URL.createObjectURL(file);
      setImageFile(file);
      setPreviewUrl(url);
      setRemoveImage(false);
    }
  };

  // Handle removing image
  const handleRemoveImage = () => {
    // If we have a preview URL that's not the original, revoke it
    if (previewUrl && previewUrl !== product.imageUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Clear the image file state
    setImageFile(null);

    // Set flag to indicate image should be removed
    setRemoveImage(true);

    // Set empty preview
    setPreviewUrl('');
  };

  // Form submission handler
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

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setError('Valid price is required');
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      setError('Valid stock quantity is required');
      toast({
        title: 'Error',
        description: 'Please enter a valid stock quantity',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create a new FormData instance
      const data = new FormData();

      // Prepare data with custom category/material if "Other" is selected
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;
      
      // Clone formData without custom fields
      const { customCategory, customMaterial, ...dataToSend } = formData;
      
      // Override category and material with final values
      dataToSend.category = finalCategory;
      dataToSend.material = finalMaterial;

      // Append form data fields
      Object.entries(dataToSend).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Append the image file if a new one was selected
      if (imageFile) {
        data.append('image', imageFile);
      }

      // Add a flag to indicate if image should be removed
      data.append('removeImage', removeImage.toString());

      console.log(`Updating product with ID: ${product.id}`);

      // Send the request to the API endpoint
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      // Close the dialog and refresh data
      setIsOpen(false);
      await onProductUpdated();
      
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="h-8 w-8"
      >
        <PenSquare className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[600px] p-6 bg-white rounded-lg shadow-lg border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Edit Product</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="stock" className="font-medium">
                Stock *
              </Label>
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
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <label
                    htmlFor="image-upload-edit"
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
          <div className="flex justify-end space-x-3 pt-2">
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
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
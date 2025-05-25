'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useKarigar } from '@/hooks/use-karigar';
import { Plus, Upload, Loader2, X } from 'lucide-react';

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
  'Copper',
  'Gold',
  'Silver',
  'Platinum',
  'Diamond',
  'Pearl',
  'White Gold',
  'Stainless Steel',
  'Other',
];

interface AddProductRequestDialogProps {
  onRequestCreated: () => void;
}

export function AddProductRequestDialog({ onRequestCreated }: AddProductRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'Necklaces', // Default to Necklaces
    material: 'Copper', // Default to Copper
    customCategory: '',
    customMaterial: '',
    costPrice: '',
    price: '',
    stock: '',
    supplier: '',
  });
  
  const [karigars, setKarigars] = useState<any[]>([]);
  const [loadingKarigars, setLoadingKarigars] = useState(false);
  const { fetchKarigars } = useKarigar();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Fetch Karigars when dialog opens
  useEffect(() => {
    const loadKarigars = async () => {
      if (isOpen) {
        try {
          setLoadingKarigars(true);
          const data = await fetchKarigars();
          console.log('Fetched karigars:', data);
          setKarigars(data);
        } catch (error) {
          console.error('Failed to load karigars:', error);
        } finally {
          setLoadingKarigars(false);
        }
      }
    };
    
    loadKarigars();
  }, [isOpen, fetchKarigars]);

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
  };  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: 'Necklaces', // Default to Necklaces
      material: 'Copper', // Default to Copper
      customCategory: '',
      customMaterial: '',
      costPrice: '',
      price: '',
      stock: '',
      supplier: '',
    });
    setImage(null);
    setImagePreview(null);
    setError(null);
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
    }    // Price and stock validation
    const costPriceValue = parseFloat(formData.costPrice);
    const sellingPriceValue = parseFloat(formData.price);
    const stockValue = parseInt(formData.stock);

    if (isNaN(costPriceValue) || costPriceValue <= 0) {
      setError('Valid cost price is required');
      toast({
        title: 'Error',
        description: 'Please enter a valid cost price',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(sellingPriceValue) || sellingPriceValue <= 0) {
      setError('Valid selling price is required');
      toast({
        title: 'Error',
        description: 'Please enter a valid selling price',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(stockValue) || stockValue < 0) {
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

      // Create form data for API request
      const formDataToSubmit = new FormData();
      
      // Prepare data with custom category/material if "Other" is selected
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;
      
      // Add request type
      formDataToSubmit.append('requestType', 'add');
        // Convert fields to JSON for the details object
      const details = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: finalCategory,
        material: finalMaterial,
        costPrice: parseFloat(formData.costPrice),
        price: parseFloat(formData.price), // Selling price
        stock: parseInt(formData.stock),
        supplier: formData.supplier || undefined
      };
      
      formDataToSubmit.append('details', JSON.stringify(details));
      
      // Add image if available
      if (image) {
        formDataToSubmit.append('image', image);
      }

      // Send request to API
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product request');
      }

      toast({
        title: 'Success',
        description: 'Product request created successfully. Waiting for admin approval.',
      });

      setIsOpen(false);
      resetForm();
      onRequestCreated();
    } catch (error) {
      console.error('Error creating product request:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product request');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product request',
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
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="text-sm">Request New Product</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6 bg-white rounded-lg shadow-lg border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Request to Add New Product</DialogTitle>
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
          </div>          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice" className="font-medium">
                Cost Price (₹) (Kharid Mulya) *
              </Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
                className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="font-medium">
                Selling Price (₹) (Bikri Mulya) *
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>          <div className="space-y-2">
            <Label htmlFor="supplier" className="font-medium">Karigar</Label>
            <Select
              value={formData.supplier}
              onValueChange={(value) =>
                setFormData({ ...formData, supplier: value })
              }
            >
              <SelectTrigger className="border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="Select karigar" />
              </SelectTrigger>
              <SelectContent>                
                {loadingKarigars ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : karigars.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No karigars found</div>
                ) : (
                  karigars.map((karigar) => (
                    <SelectItem key={karigar.id} value={karigar.name}>
                      {karigar.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Product Image</Label>
            <div 
              ref={dropZoneRef}
              className={`border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 transition-colors duration-200`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
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
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="request-image-upload"
                  />
                  <label
                    htmlFor="request-image-upload"
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
                  Submitting Request...
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
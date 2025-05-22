'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, X, Plus, Trash2 } from 'lucide-react';
import { useKarigar } from '@/hooks/use-karigar';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

// Reuse categories and materials from AddProductDialog
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

export function AddLongSetProductDialog({ onProductAdded }: { onProductAdded: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [loadingKarigars, setLoadingKarigars] = useState(false);
  const { toast } = useToast();
  const { fetchKarigars } = useKarigar();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Base product form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'Necklaces', // Default to Necklaces
    material: 'Copper', // Default to Gold
    customCategory: '',
    customMaterial: '',
    costPrice: '',
    sellingPrice: '',
    stock: '',
  });
  // Product parts data
  const [parts, setParts] = useState([
    { 
      partName: 'Part 1', 
      partDescription: '', 
      costPrice: '',
      karigarId: 'none'
    }
  ]);

  // Fetch Karigars when dialog opens
  useEffect(() => {
    const loadKarigars = async () => {
      if (isOpen) {
        try {
          setLoadingKarigars(true);
          const fetchedKarigars = await fetchKarigars();
          setKarigars(fetchedKarigars.filter((k:any) => k.isApproved));
        } catch (error) {
          console.error('Error fetching karigars:', error);
          toast({
            title: 'Error',
            description: 'Failed to load artisans',
            variant: 'destructive',
          });
        } finally {
          setLoadingKarigars(false);
        }
      }
    };
    
    loadKarigars();
  }, [isOpen, fetchKarigars, toast]);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: 'Necklaces',
      material: 'Copper',
      customCategory: '',
      customMaterial: '',
      costPrice: '',
      sellingPrice: '',
      stock: '',
    });    setParts([
      { 
        partName: 'Part 1', 
        partDescription: '', 
        costPrice: '',
        karigarId: 'none'
      }
    ]);
    setImageFile(null);
    setPreviewUrl('');
    setError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePartChange = (index: number, field: string, value: string) => {
    const updatedParts = [...parts];
    updatedParts[index] = {
      ...updatedParts[index],
      [field]: value
    };
    setParts(updatedParts);
  };

  const addPart = () => {
    setParts([
      ...parts,
      {        partName: `Part ${parts.length + 1}`,
        partDescription: '',
        costPrice: '',
        karigarId: 'none'
      }
    ]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      const updatedParts = parts.filter((_, i) => i !== index);
      setParts(updatedParts);
    } else {
      toast({
        title: 'Info',
        description: 'A long set product must have at least one part',
      });
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
          description: 'Please upload a valid image file',
          variant: 'destructive',
        });
        return;
      }
      
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    // Base product validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.sku.trim()) {
      setError("Product ID is required");
      toast({
        title: 'Error',
        description: 'Product ID is required',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.category) {
      setError("Category is required");
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      setError("Custom category is required when 'Other' is selected");
      toast({
        title: 'Error',
        description: "Please enter a custom category name",
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.material) {
      setError("Material is required");
      toast({
        title: 'Error',
        description: 'Please select a material',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.material === 'Other' && !formData.customMaterial.trim()) {
      setError("Custom material is required when 'Other' is selected");
      toast({
        title: 'Error',
        description: "Please enter a custom material name",
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.sellingPrice || isNaN(parseFloat(formData.sellingPrice))) {
      setError("Valid selling price is required");
      toast({
        title: 'Error',
        description: 'Please enter a valid selling price',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      setError("Valid stock quantity is required");
      toast({
        title: 'Error',
        description: 'Please enter a valid stock quantity',
        variant: 'destructive',
      });
      return false;
    }

    // Validate parts
    let totalCostPrice = 0;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part.partName.trim()) {
        setError(`Part ${i + 1} name is required`);
        toast({
          title: 'Error',
          description: `Part ${i + 1} name is required`,
          variant: 'destructive',
        });
        return false;
      }

      // Cost price is optional for parts, but must be valid if provided
      if (part.costPrice && isNaN(parseFloat(part.costPrice))) {
        setError(`Valid cost price is required for part ${i + 1}`);
        toast({
          title: 'Error',
          description: `Please enter a valid cost price for part ${i + 1}`,
          variant: 'destructive',
        });
        return false;
      }

      if (part.costPrice) {
        totalCostPrice += parseFloat(part.costPrice);
      }
    }

    // Set total cost price based on sum of parts
    if (totalCostPrice > 0) {
      setFormData(prev => ({
        ...prev,
        costPrice: totalCostPrice.toString()
      }));
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    try {
      const DEFAULT_IMAGE_URL = "https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png";
      setIsLoading(true);
        // Prepare data with custom category/material if "Other" is selected
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;

      // Build data for submit
      const longSetProductData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || '',
        category: finalCategory,
        material: finalMaterial,
        price: parseFloat(formData.sellingPrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        stock: parseInt(formData.stock),
        parts: parts.map(part => ({
          partName: part.partName,
          partDescription: part.partDescription || '',
          costPrice: part.costPrice ? parseFloat(part.costPrice) : null,
          karigarId: part.karigarId && part.karigarId !== 'none' ? part.karigarId : null
        }))
      };

      let requestOptions: RequestInit;
      
      // If there's an image file, use FormData
      if (imageFile) {
        const data = new FormData();
        Object.entries(longSetProductData).forEach(([key, value]) => {
          if (key !== 'parts') {
            data.append(key, String(value));
          }
        });
        // Add parts as JSON string
        data.append('parts', JSON.stringify(longSetProductData.parts));
        data.append('image', imageFile);
        
        requestOptions = {
          method: 'POST',
          body: data
        };      } else {
        // If no image, send as JSON with default imageUrl
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...longSetProductData,
            imageUrl: DEFAULT_IMAGE_URL
          })
        };
      }
      
      // Determine the endpoint based on user role
      const endpoint = isAdmin 
        ? '/api/products/long-set'  // Direct creation for admins
        : '/api/product-requests/long-set';  // Request system for shopkeepers
      
      // Send the request to create a long set product or product request
      const response = await fetch(endpoint, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create long set product');
      }

      // Call the callback to refresh products
      await onProductAdded();

      // Show success toast with appropriate message
      toast({
        title: 'Success',
        description: isAdmin 
          ? 'Long set product created successfully' 
          : 'Long set product request submitted for approval',
      });
      
      // Close the dialog and reset form
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating long set product:', error);
      
      // Set error message and show toast
      const errorMessage = error.message || 'Failed to create long set product';
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
    >      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          {isAdmin ? "Add Long Set" : "Request Long Set"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-6 bg-white rounded-lg shadow-lg border-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isAdmin ? "Add Long Set Product" : "Request Long Set Product"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Base Product Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Product Information</h3>
            
            {/* Product name and SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">Product ID (SKU)</Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Enter product ID"
                  value={formData.sku}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
              />
            </div>
            
            {/* Category and Material */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
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
                      name="customCategory"
                      placeholder="Enter custom category"
                      value={formData.customCategory}
                      onChange={handleFormChange}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => handleSelectChange('material', value)}
                >
                  <SelectTrigger>
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
                      name="customMaterial"
                      placeholder="Enter custom material"
                      value={formData.customMaterial}
                      onChange={handleFormChange}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  placeholder="Enter selling price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  placeholder="Enter stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            {/* Product Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                
                {previewUrl && (
                  <div className="relative w-16 h-16">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setPreviewUrl('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Parts Section */}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-semibold">Product Parts</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addPart}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </Button>
            </div>
            
            <div className="space-y-6">
              {parts.map((part, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-md">
                        {part.partName}
                      </h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePart(index)}
                        disabled={parts.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`partName-${index}`}>Part Name</Label>
                        <Input
                          id={`partName-${index}`}
                          value={part.partName}
                          onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                          placeholder="Enter part name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`costPrice-${index}`}>Cost Price (₹)</Label>
                        <Input
                          id={`costPrice-${index}`}
                          value={part.costPrice}
                          onChange={(e) => handlePartChange(index, 'costPrice', e.target.value)}
                          placeholder="Enter cost price"
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`partDescription-${index}`}>Part Description</Label>
                        <Textarea
                          id={`partDescription-${index}`}
                          value={part.partDescription}
                          onChange={(e) => handlePartChange(index, 'partDescription', e.target.value)}
                          placeholder="Enter part description"
                          rows={2}
                        />
                      </div>
                        <div className="space-y-2">
                        <Label htmlFor={`karigar-${index}`}>Karigar (Artisan)</Label>
                        <Select
                          value={part.karigarId}
                          onValueChange={(value) => handlePartChange(index, 'karigarId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Karigar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None Selected</SelectItem>
                            {karigars.map((karigar) => (
                              <SelectItem key={karigar.id} value={karigar.id}>
                                {karigar.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : isAdmin ? 'Create Long Set Product' : 'Submit Request'}
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mt-4">
              {error}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

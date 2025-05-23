'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useKarigar } from '@/hooks/use-karigar';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

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

interface LongSetProductPart {
  partName: string;
  partDescription: string;
  costPrice: string;
  karigarId: string;
}

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
    category: '',
    material: '',
    customCategory: '',
    customMaterial: '',
    costPrice: '',
    sellingPrice: '',
    stock: '1',
  });

  // Product parts data
  const [parts, setParts] = useState<LongSetProductPart[]>([
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
          setKarigars(fetchedKarigars.filter((k: any) => k.isApproved));
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
      {
        partName: `Part ${parts.length + 1}`,
        partDescription: '',
        costPrice: '',
        karigarId: 'none'
      }
    ]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    } else {
      toast({
        title: 'Error',
        description: 'Long set product must have at least one part',
        variant: 'destructive',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      material: '',
      customCategory: '',
      customMaterial: '',
      costPrice: '',
      sellingPrice: '',
      stock: '1',
    });
    setParts([
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

  const validateForm = () => {
    if (!formData.name || !formData.sku || !formData.sellingPrice || !formData.stock) {
      setError('Please fill in all required fields');
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return false;
    }

    if (parts.some(part => !part.partName)) {
      setError('Each part must have a name');
      toast({
        title: 'Error',
        description: 'Each part must have a name',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;

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
        data.append('parts', JSON.stringify(longSetProductData.parts));
        data.append('image', imageFile);
        
        requestOptions = {
          method: 'POST',
          body: data
        };
      } else {
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

      // Send request to the appropriate endpoint
      const response = await fetch('/api/products/long-set', requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create long set product request');
      }

      // Call the callback to refresh products
      await onProductAdded();

      // Show success message
      toast({
        title: 'Success',
        description: isAdmin 
          ? 'Long set product request created and waiting for approval' 
          : 'Long set product request submitted for approval',
      });
      
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating long set product request:', error);
      const errorMessage = error.message || 'Failed to create long set product request';
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
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          {isAdmin ? "Create Long Set Request" : "Request Long Set"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-6 bg-white rounded-lg shadow-lg border-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isAdmin ? "Create Long Set Product Request" : "Request Long Set Product"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Base Product Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Product Information</h3>
            
            {/* Product name and SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="sku">Product ID <span className="text-red-500">*</span></Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Enter Product ID"
                  value={formData.sku}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            {/* Category and Material */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
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
                  <Input
                    className="mt-2"
                    name="customCategory"
                    placeholder="Enter custom category"
                    value={formData.customCategory}
                    onChange={handleFormChange}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material <span className="text-red-500">*</span></Label>
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
                  <Input
                    className="mt-2"
                    name="customMaterial"
                    placeholder="Enter custom material"
                    value={formData.customMaterial}
                    onChange={handleFormChange}
                  />
                )}
              </div>
            </div>
            
            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹) <span className="text-red-500">*</span></Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={handleFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock <span className="text-red-500">*</span></Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
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
                placeholder="Product description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
              />
            </div>
            
            {/* Product Image */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="mt-1 flex items-center space-x-4">
                <div 
                  className="w-24 h-24 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center bg-gray-50"
                >
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Product preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs text-center px-1">No image selected</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: 500x500px, PNG or JPG
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Parts Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold border-b pb-2">Parts Information</h3>
              <Button
                type="button"
                onClick={addPart}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </Button>
            </div>
            
            <div className="space-y-4">
              {parts.map((part, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Part {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removePart(index)}
                        variant="ghost"
                        size="sm"
                        disabled={parts.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Part Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={part.partName}
                          onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                          placeholder="Enter part name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={part.costPrice}
                          onChange={(e) => handlePartChange(index, 'costPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={part.partDescription}
                          onChange={(e) => handlePartChange(index, 'partDescription', e.target.value)}
                          placeholder="Part description"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Karigar (Artisan)</Label>
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
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isAdmin ? "Create Request" : "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

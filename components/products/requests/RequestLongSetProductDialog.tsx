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

// Reuse categories and materials from other dialogs
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

export function RequestLongSetProductDialog({ onRequestCreated }: { onRequestCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [loadingKarigars, setLoadingKarigars] = useState(false);
  const { toast } = useToast();
  const { fetchKarigars } = useKarigar();

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
            description: 'Failed to load Karigars',
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.sellingPrice || !formData.stock) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate parts 
      if (parts.some(part => !part.partName)) {
        throw new Error('Each part must have a name');
      }
      
      // Validate numeric fields
      if (isNaN(parseFloat(formData.sellingPrice)) || parseFloat(formData.sellingPrice) <= 0) {
        throw new Error('Selling price must be a positive number');
      }
      
      if (formData.costPrice && (isNaN(parseFloat(formData.costPrice)) || parseFloat(formData.costPrice) < 0)) {
        throw new Error('Cost price must be a non-negative number');
      }
      
      if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
        throw new Error('Stock must be a non-negative integer');
      }
      
      // Determine final category and material values
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      const finalMaterial = formData.material === 'Other' ? formData.customMaterial : formData.material;
      
      // Prepare data for API request
      const longSetProductData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
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

      // Create FormData for API request
      const formDataToSubmit = new FormData();
      
      // Add base product data
      Object.entries(longSetProductData).forEach(([key, value]) => {
        if (key !== 'parts') {
          formDataToSubmit.append(key, String(value));
        }
      });
      
      // Add parts as JSON string
      formDataToSubmit.append('parts', JSON.stringify(longSetProductData.parts));
      
      // Add image if provided
      if (imageFile) {
        formDataToSubmit.append('image', imageFile);
      }

      // Send request to API
      const response = await fetch('/api/product-requests/long-set', {
        method: 'POST',
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create long set product request');
      }

      toast({
        title: 'Success',
        description: 'Long set product request created successfully. Waiting for admin approval.',
      });

      setIsOpen(false);
      resetForm();
      onRequestCreated();
    } catch (error: any) {
      console.error('Error creating long set product request:', error);
      setError(error.message || 'Failed to create long set product request');
      toast({
        title: 'Error',
        description: error.message || 'Failed to create long set product request',
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
          Request Long Set Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-6 bg-white rounded-lg shadow-lg border-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Request New Long Set Product</DialogTitle>
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
                  placeholder="Unique product ID"
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
                  required
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
                    placeholder="Enter custom category"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => handleSelectChange('material', value)}
                  required
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
                    placeholder="Enter custom material"
                    value={formData.customMaterial}
                    onChange={(e) => setFormData({...formData, customMaterial: e.target.value})}
                    required
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
                  step="1"
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
                <Card key={index} className="overflow-hidden border border-gray-200">
                  <CardContent className="p-4 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Part {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removePart(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`partName-${index}`}>Part Name <span className="text-red-500">*</span></Label>
                        <Input
                          id={`partName-${index}`}
                          value={part.partName}
                          onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`partCost-${index}`}>Cost Price</Label>
                        <Input
                          id={`partCost-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={part.costPrice}
                          onChange={(e) => handlePartChange(index, 'costPrice', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`partDesc-${index}`}>Description</Label>
                        <Textarea
                          id={`partDesc-${index}`}
                          value={part.partDescription}
                          onChange={(e) => handlePartChange(index, 'partDescription', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`partArtisan-${index}`}>Karigar</Label>
                        <Select
                          value={part.karigarId}
                          onValueChange={(value) => handlePartChange(index, 'karigarId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select karigar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
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
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full sm:w-auto"
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

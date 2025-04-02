'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { motion, AnimatePresence } from 'framer-motion';

import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  image: string;
  lowStock?: boolean;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Diamond Engagement Ring',
    sku: 'RNG-DMD-001',
    category: 'Rings',
    material: 'Platinum',
    price: 4850,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300',
  },
  {
    id: '2',
    name: 'Gold Chain Necklace',
    sku: 'NCK-GLD-002',
    category: 'Necklaces',
    material: 'Gold',
    price: 1250,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300',
  },
  {
    id: '3',
    name: 'Silver Hoop Earrings',
    sku: 'EAR-SLV-003',
    category: 'Earrings',
    material: 'Silver',
    price: 350,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=300',
  },
  {
    id: '4',
    name: 'Sapphire Tennis Bracelet',
    sku: 'BRC-SPH-004',
    category: 'Bracelets',
    material: 'White Gold',
    price: 2750,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=300',
    lowStock: true,
  },
  {
    id: '5',
    name: "Men's Luxury Watch",
    sku: 'WTC-LUX-005',
    category: 'Watches',
    material: 'Stainless Steel',
    price: 5950,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=300',
    lowStock: true,
  },
  {
    id: '6',
    name: 'Pearl Drop Earrings',
    sku: 'EAR-PRL-006',
    category: 'Earrings',
    material: 'Gold',
    price: 890,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=300',
  },
];

const categories = [
  { name: 'Rings', count: 428 },
  { name: 'Necklaces', count: 312 },
  { name: 'Earrings', count: 256 },
  { name: 'Bracelets', count: 184 },
  { name: 'Watches', count: 66 },
];

const materials = [
  { name: 'Gold', count: 386 },
  { name: 'Silver', count: 294 },
  { name: 'Platinum', count: 142 },
  { name: 'Diamond', count: 218 },
  { name: 'Other', count: 206 },
];

export default function InventoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    materials: new Set<string>(),
    inStockOnly: false,
    showLowStock: false,
  });

  const toggleFilter = (type: 'categories' | 'materials', value: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const resetFilters = () => {
    setFilters({
      categories: new Set(),
      materials: new Set(),
      inStockOnly: false,
      showLowStock: false,
    });
    setPriceRange([0, 10000]);
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    return (
      filters.categories.size +
      filters.materials.size +
      (filters.inStockOnly ? 1 : 0) +
      (filters.showLowStock ? 1 : 0)
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filters.categories.size === 0 ||
      filters.categories.has(product.category);
    const matchesMaterial =
      filters.materials.size === 0 || filters.materials.has(product.material);
    const matchesStock = !filters.inStockOnly || product.stock > 0;
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];

    return (
      matchesSearch &&
      matchesCategory &&
      matchesMaterial &&
      matchesStock &&
      matchesPrice
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-4">
        <h1 className="text-3xl md:text-3xl font-bold">Inventory Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <AddProductDialog />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products, SKUs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Delete Selected</DropdownMenuItem>
                <DropdownMenuItem>Export Selected</DropdownMenuItem>
                <DropdownMenuItem>Update Stock</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              {showFilters ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <Filter className="mr-2 h-4 w-4" />
              )}
              Filters
              {getActiveFiltersCount() > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Animated Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="md:col-span-1"
            >
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between"
                        >
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.categories.has(category.name)}
                              onChange={() =>
                                toggleFilter('categories', category.name)
                              }
                              className="rounded border-gray-300"
                            />
                            <span>{category.name}</span>
                          </label>
                          <span className="text-muted-foreground text-sm">
                            ({category.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Materials</h3>
                    <div className="space-y-2">
                      {materials.map((material) => (
                        <div
                          key={material.name}
                          className="flex items-center justify-between"
                        >
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.materials.has(material.name)}
                              onChange={() =>
                                toggleFilter('materials', material.name)
                              }
                              className="rounded border-gray-300"
                            />
                            <span>{material.name}</span>
                          </label>
                          <span className="text-muted-foreground text-sm">
                            ({material.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Price Range</h3>
                    <div className="space-y-4">
                      <Slider
                        value={priceRange}
                        min={0}
                        max={10000}
                        step={100}
                        onValueChange={setPriceRange}
                      />
                      <div className="flex justify-between text-sm">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label>In Stock Only</label>
                      <Switch
                        checked={filters.inStockOnly}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            inStockOnly: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>Show Low Stock</label>
                      <Switch
                        checked={filters.showLowStock}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            showLowStock: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid/List - Responsive column span */}
        <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                    {product.lowStock && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      {product.sku}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">
                        ${product.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-sm ${
                          product.stock < 10
                            ? 'text-red-500'
                            : 'text-green-500'
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Material</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-left p-4">Stock</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{product.sku}</td>
                        <td className="p-4">{product.category}</td>
                        <td className="p-4">{product.material}</td>
                        <td className="p-4">
                          ${product.price.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`${
                              product.stock < 10
                                ? 'text-red-500'
                                : 'text-green-500'
                            }`}
                          >
                            {product.stock}
                          </span>
                          {product.lowStock && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
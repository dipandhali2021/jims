'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ProductPreviewDialog } from '@/components/products/ProductPreviewDialog';
import { EditProductDialog } from '@/components/products/EditProductDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { LowStockThresholdSetting } from '@/components/admin/LowStockThresholdSetting';

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
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateBulkSalesRequestDialog } from '@/components/products/CreateBulkSalesRequestDialog';
import { Switch } from '@/components/ui/switch';
import { CreateSalesRequestDialog } from '@/components/products/CreateSalesRequestDialog';

// Derive categories and materials from products
const getCategoriesAndCounts = (products: Product[]) => {
  const categoryCount = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryCount).map(([name, count]) => ({
    name,
    count,
  }));
};

const getMaterialsAndCounts = (products: Product[]) => {
  const materialCount = products.reduce((acc, product) => {
    acc[product.material] = (acc[product.material] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(materialCount).map(([name, count]) => ({
    name,
    count,
  }));
};

export default function InventoryPage() {
  const { user } = useUser();
  const { products, isLoading, error, refreshProducts } = useProducts();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    materials: new Set<string>(),
    inStockOnly: false,
    showLowStock: false,
  });

  // Fetch the current threshold value
  const fetchLowStockThreshold = async () => {
    try {
      const response = await fetch('/api/settings/low-stock-threshold');
      if (response.ok) {
        const data = await response.json();
        setLowStockThreshold(data.threshold);
      }
    } catch (error) {
      console.error('Error fetching low stock threshold:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch low stock threshold',
        variant: 'destructive',
      });
    }
  };

  // Fetch the threshold on initial load
  useEffect(() => {
    fetchLowStockThreshold();
  }, []);

  // Function to update threshold and refresh products
  const handleThresholdUpdated = async () => {
    await fetchLowStockThreshold();
    refreshProducts();
  };

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

  const filteredProducts = products
    .map((product) => ({
      ...product,
      lowStock: product.stock < (product.lowStockThreshold || 10),
    }))
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filters.categories.size === 0 ||
        filters.categories.has(product.category);
      const matchesMaterial =
        filters.materials.size === 0 || filters.materials.has(product.material);
      const matchesStock = !filters.inStockOnly || product.stock > 0;
      const matchesLowStock = filters.showLowStock ? product.lowStock : true;
      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMaterial &&
        matchesStock &&
        matchesLowStock &&
        matchesPrice
      );
    });

  // Calculate paginated results
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-2xl font-bold">Inventory Management</h1>
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
          {user?.publicMetadata?.role === 'admin' && (
            <>
              <LowStockThresholdSetting 
                currentThreshold={lowStockThreshold}
                onThresholdUpdated={handleThresholdUpdated}
              />
              <AddProductDialog onProductAdded={refreshProducts} />
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products, IDs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
            <CreateBulkSalesRequestDialog products={products} onRequestCreated={refreshProducts} />
            {/* <Button
              variant={showFilters ? 'default' : 'outline'}
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
            </Button> */}
            </div>
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
                      {getCategoriesAndCounts(products).map((category) => (
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
                      {getMaterialsAndCounts(products).map((material) => (
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
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}+</span>
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
        <div className={showFilters ? 'md:col-span-3' : 'md:col-span-4'}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 10 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-10">
                  <p className="text-red-500">Failed to load products</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                paginatedProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div
                      className="aspect-square relative cursor-pointer"
                      onClick={() =>
                        (
                          document.getElementById(
                            `preview-${product.id}`
                          ) as HTMLButtonElement
                        )?.click()
                      }
                    >
                      <img
                        src={product.imageUrl}
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
                        ₹{product.price.toLocaleString()}
                        </span>
                        <span
                          className={`text-sm ${
                            product.stock < (product.lowStockThreshold || 10)
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                        <div className="flex mt-4 justify-evenly flex-wrap md:flex-nowrap">
                        <CreateSalesRequestDialog
                          product={product}
                          onRequestCreated={refreshProducts}
                        />
                        <ProductPreviewDialog product={product} />
                        {user?.publicMetadata?.role === 'admin' && (
                          <>
                            <EditProductDialog
                              product={product}
                              onProductUpdated={refreshProducts}
                            />
                            <DeleteProductDialog
                              product={product}
                              onProductDeleted={refreshProducts}
                            />
                          </>
                        )}
                        </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
                      <th className="text-left p-4">Product ID</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Material</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-left p-4">Stock</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
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
                        ₹{product.price.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`${
                              product.stock < (product.lowStockThreshold || 10)
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
                            <ProductPreviewDialog product={product} />
                            {user?.publicMetadata?.role === 'admin' && (
                              <>
                                <EditProductDialog
                                  product={product}
                                  onProductUpdated={refreshProducts}
                                />
                                <DeleteProductDialog
                                  product={product}
                                  onProductDeleted={refreshProducts}
                                />
                              </>
                            )}
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
      
      {/* Pagination Controls */}
      {products.length > 0 ? (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden w-8 h-8 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              <span className="sr-only">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                // Show at most 3 page numbers
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                
                if (pageNum <= 3) {
                  return (
                    <Button
                      key={i}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isActive}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
              
              {totalPages > 3 && (
                <span className="mx-1">...</span>
              )}
              
              {totalPages > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {totalPages}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
              <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden w-8 h-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-muted/20 rounded-md mt-4 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  );
}

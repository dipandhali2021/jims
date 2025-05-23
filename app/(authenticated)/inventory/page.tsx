'use client';


import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ProductPreviewDialog } from '@/components/products/ProductPreviewDialog';
import { EditProductDialog } from '@/components/products/EditProductDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { Product, useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { LowStockThresholdSetting } from '@/components/admin/LowStockThresholdSetting';
import { AddLongSetProductDialog } from '@/components/products/AddLongSetProductDialog';
import { EditLongSetProductDialog } from '@/components/products/EditLongSetProductDialog';

import {
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { CreateBulkSalesRequestDialog } from '@/components/products/CreateBulkSalesRequestDialog';
import { CreateSalesRequestDialog } from '@/components/products/CreateSalesRequestDialog';
import { AddProductRequestDialog } from '@/components/products/requests/AddProductRequestDialog';
import { EditProductRequestDialog } from '@/components/products/requests/EditProductRequestDialog';
import { DeleteProductRequestDialog } from '@/components/products/requests/DeleteProductRequestDialog';

export default function InventoryPage() {
  const { user } = useUser();
  const { products, isLoading, error, refreshProducts } = useProducts();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter products only by search term
  const filteredProducts = products.filter((product) => {
    const productName = product.name?.toLowerCase() || '';
    const productSku = product.sku?.toLowerCase() || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return searchTerm === '' || 
      productName.includes(searchTermLower) ||
      productSku.includes(searchTermLower);
  });

  // Paginate products
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  return (
    <div className="p-6">      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-2xl font-bold">Inventory Management</h1>          <Button 
            variant="outline"
            size="sm"
            asChild
            className="hidden md:flex items-center gap-2"
          >
            <Link href="/inventory/dashboard" prefetch={true}>
              Dashboard
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Link>
          </Button>
        </div>
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
          {user?.publicMetadata?.role === 'admin' ? (
            <>
              <LowStockThresholdSetting 
                currentThreshold={lowStockThreshold}
                onThresholdUpdated={handleThresholdUpdated}
              />
              <AddLongSetProductDialog onProductAdded={refreshProducts} />
              <AddProductDialog onProductAdded={refreshProducts} />
            </>
          ) : (
            <>
              <AddLongSetProductDialog onProductAdded={refreshProducts} />
              <AddProductRequestDialog onRequestCreated={refreshProducts} />
            </>
          )}
        </div>
      </div>

      {/* Search and Bulk Request Button */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div className="mt-6">
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
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
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-muted animate-pulse" />
                            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          </div>
                        </td>
                        <td className="p-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                        <td className="p-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
                        <td className="p-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
                        <td className="p-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                        <td className="p-4"><div className="h-4 bg-muted rounded w-12 animate-pulse" /></td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ) : error ? (
          <div className="text-center p-10">
            <p className="text-red-500">Failed to load products</p>
            <Button
              variant="outline"
              onClick={() => refreshProducts()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-10 bg-muted/20 rounded-lg">
            {searchTerm ? (
              <p>No products found matching your search</p>
            ) : (
              <>
                <p>No products found</p>
                {user?.publicMetadata?.role === 'admin' && (
                  <p className="mt-2">
                    Click the "+" button above to add your first product
                  </p>
                )}
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentProducts.map((product) => (
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
                >                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />                  {product.stock < (product.lowStockThreshold || lowStockThreshold) && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Low Stock
                    </span>
                  )}
                  {(product.isLongSet || product.longSetProduct) && (
                    <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                      Long Set
                    </span>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <div className="text-sm text-muted-foreground mb-2">
                    {product.sku}
                  </div>                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">
                    ₹{product.price?.toLocaleString()}
                    </span>
                    <span
                      className={`text-sm ${
                        product.stock < (product.lowStockThreshold || lowStockThreshold)
                          ? 'text-red-500'
                          : 'text-green-500'
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>                  <div className="flex mt-4 justify-evenly flex-wrap md:flex-nowrap">
                    <CreateSalesRequestDialog
                      product={product}
                      onRequestCreated={refreshProducts}
                    />                    <ProductPreviewDialog product={product} />
                    {user?.publicMetadata?.role === 'admin' ? (
                      <>
                        {(product.isLongSet || product.longSetProduct) ? (
                          <EditLongSetProductDialog
                            product={product}
                            onProductUpdated={refreshProducts}
                          />
                        ) : (
                          <EditProductDialog
                            product={product}
                            onProductUpdated={refreshProducts}
                          />
                        )}
                        <DeleteProductDialog
                          product={product}
                          onProductDeleted={refreshProducts}
                        />
                      </>
                    ) : (
                      <>
                        {(product.isLongSet || product.longSetProduct) ? (
                          <EditLongSetProductDialog
                            product={product}
                            onProductUpdated={refreshProducts}
                          />
                        ) : (
                          <EditProductRequestDialog
                            product={product}
                            onRequestCreated={refreshProducts}
                          />
                        )}
                        <DeleteProductRequestDialog
                          product={product}
                          onRequestCreated={refreshProducts}
                        />
                      </>
                    )}
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
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />                          <div>
                            <span className="font-medium">{product.name}</span>
                            {(product.isLongSet || product.longSetProduct) && (
                              <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                Long Set
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">{product.material}</td>
                      <td className="p-4">
                      ₹{product.price?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`${
                            product.stock < (product.lowStockThreshold || lowStockThreshold)
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <ProductPreviewDialog product={product} />
                          <CreateSalesRequestDialog
                            product={product}
                            onRequestCreated={refreshProducts}
                          />                          {user?.publicMetadata?.role === 'admin' ? (
                            <>
                              {(product.isLongSet || product.longSetProduct) ? (
                                <EditLongSetProductDialog
                                  product={product}
                                  onProductUpdated={refreshProducts}
                                />
                              ) : (
                                <EditProductDialog
                                  product={product}
                                  onProductUpdated={refreshProducts}
                                />
                              )}
                              <DeleteProductDialog
                                product={product}
                                onProductDeleted={refreshProducts}
                              />
                            </>
                          ) : (
                            <>
                              {(product.isLongSet || product.longSetProduct) ? (
                                <EditLongSetProductDialog
                                  product={product}
                                  onProductUpdated={refreshProducts}
                                />
                              ) : (
                                <EditProductRequestDialog
                                  product={product}
                                  onRequestCreated={refreshProducts}
                                />
                              )}
                              <DeleteProductRequestDialog
                                product={product}
                                onRequestCreated={refreshProducts}
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
      
      {/* Simple Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
              Previous
            </Button>
            
            <span className="mx-4">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1))}
            >
              Next
              <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * Products Page
 * Main page component for displaying and managing products
 */

import { useState } from "react";
import { useProducts, useDeleteProduct } from "../src/services/products/hooks/use-products";
import { Plus, RefreshCw, Package, AlertCircle, Star, DollarSign, Search, X } from "lucide-react";
import { Pagination } from "../src/components/ui/pagination";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { Badge } from "../src/components/ui/badge";
import { IconButton } from "../src/components/ui/icon-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import { PAGINATION } from "../src/lib/constants";
import { ProductFilters, Product } from "../src/services/products/types/product.types";

export default function ProductsPage() {
  const [queryParams, setQueryParams] = useState<ProductFilters>({
    page: PAGINATION.defaultPage,
    limit: PAGINATION.defaultPageSize,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError, error, refetch } =
    useProducts(queryParams);
  const deleteProduct = useDeleteProduct();

  const handleFilterChange = (filters: ProductFilters) => {
    setQueryParams((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, limit: pageSize, page: 1 }));
  };

  const handleEdit = (product: Product) => {
    // TODO: Implement edit functionality
    console.log("Edit product:", product);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct.mutateAsync(product.id);
        // Success feedback handled by the mutation hook
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleView = (product: Product) => {
    // TODO: Implement view functionality
    console.log("View product:", product);
  };

  const handleCreateNew = () => {
    // TODO: Implement create functionality
    console.log("Create new product");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const debounce = setTimeout(() => {
      if (value !== queryParams.search) {
        const newFilters = { ...queryParams, search: value || undefined, page: 1 };
        handleFilterChange(newFilters);
      }
    }, 300);

    return () => clearTimeout(debounce);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setQueryParams({
      page: PAGINATION.defaultPage,
      limit: PAGINATION.defaultPageSize,
    });
  };

  const hasActiveFilters = Object.keys(queryParams).some(
    (key) => queryParams[key as keyof ProductFilters] !== undefined && key !== 'page' && key !== 'limit'
  );

  const getStatusVariant = (isActive?: boolean, isFeatured?: boolean): 'default' | 'success' | 'danger' => {
    if (isFeatured) return "default";
    if (isActive) return "success";
    return "danger";
  };

  const getStatusLabel = (isActive?: boolean, isFeatured?: boolean) => {
    if (isFeatured) return "Featured";
    if (isActive) return "Active";
    return "Inactive";
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return numPrice.toFixed(2);
  };

  const formatRating = (rating?: number | string) => {
    if (!rating) return "0.0";
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
    return numRating.toFixed(1);
  };

  const products = data?.data.data || [];

  if (isError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-third">
                Error Loading Products
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">{error.message}</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      {/* Header */}
      <div className="w-full justify-between items-center flex gap-5">
        <div className="flex items-center gap-5">
          <div className="rounded-rounded1 bg-fourth to-fourth p-3">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-third tracking-tight">Products</h1>
            <p className="text-gray-600 mt-1">
              Manage your product inventory
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          Create
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold text-third">Filters</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-1 max-w-sm">
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              label="Search"
              variant="search"              
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="h-9"
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            <div className="text-gray-600 font-medium">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-gray-600 font-medium text-lg">No products found</div>
            <div className="text-gray-400 text-sm">Try adjusting your filters or add new products</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-semibold text-third max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{product.name}</div>
                        {product.isFeatured && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-fourth fill-fourth" />
                            <span className="text-xs text-fourth">Featured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {product.sku || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-700">
                      {typeof product.category === 'object' 
                        ? product.category?.name 
                        : product.category || <span className="text-gray-400">Uncategorized</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-third">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      {formatPrice(product.price)}
                    </div>
                    {product.discountPrice && (
                      <div className="ml-5 text-xs text-gray-400 line-through">
                        ${formatPrice(product.discountPrice)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 50 
                        ? 'bg-fourth/20 text-fourth' 
                        : product.stock > 10 
                        ? 'bg-sixth/20 text-sixth' 
                        : 'bg-danger/20 text-danger'
                    }`}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-fourth fill-fourth" />
                      <span className="font-semibold text-third">{formatRating(product.averageRating)}</span>
                      {product.totalRatings && (
                        <span className="text-xs text-gray-400">({product.totalRatings})</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(product.isActive, product.isFeatured)}>
                      {getStatusLabel(product.isActive, product.isFeatured)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <IconButton
                        variant="view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(product);
                        }}
                        title="View product"
                      />
                      <IconButton
                        variant="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        title="Edit product"
                      />
                      <IconButton
                        variant="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product);
                        }}
                        title="Delete product"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {data?.data.pagination && (
        <Card>
          <Pagination
            pagination={{
              currentPage: data.data.pagination.page,
              pageSize: data.data.pagination.limit,
              totalItems: data.data.pagination.total,
              totalPages: data.data.pagination.totalPages,
              hasNextPage: data.data.pagination.page < data.data.pagination.totalPages,
              hasPreviousPage: data.data.pagination.page > 1,
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showPageSize={true}
          />
        </Card>
      )}
    </div>
  );
}

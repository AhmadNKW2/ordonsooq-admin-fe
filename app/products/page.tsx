"use client";

/**
 * Products Page
 * Main page component for displaying and managing products
 */

import { useState, useMemo } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import Image from "next/image";
import { useProducts, useDeleteProduct, useProduct } from "../src/services/products/hooks/use-products";
import { Plus, RefreshCw, Package, AlertCircle, Star, X } from "lucide-react";
import { Pagination } from "../src/components/ui/pagination";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { PageHeader } from "../src/components/common/PageHeader";
import { EmptyState } from "../src/components/common/EmptyState";
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
import { ProductViewModal } from "../src/components/products/ProductViewModal";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";

export default function ProductsPage() {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<ProductFilters>({
    page: PAGINATION.defaultPage,
    limit: PAGINATION.defaultPageSize,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [viewProductId, setViewProductId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data, isLoading, isError, error, refetch } =
    useProducts(queryParams);
  const deleteProduct = useDeleteProduct();

  // Fetch product details when viewing
  const { data: viewProductData, isLoading: isLoadingViewProduct } = useProduct(
    viewProductId || 0,
    { enabled: !!viewProductId }
  );

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
    router.push(`/products/${product.id}`);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await deleteProduct.mutateAsync(productToDelete.id);
        setDeleteModalOpen(false);
        setProductToDelete(null);
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleView = (product: Product) => {
    setViewProductId(product.id);
  };

  const handleCloseViewModal = () => {
    setViewProductId(null);
  };

  const handleCreateNew = () => {
    router.push("/products/create");
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

  const getStatusVariant = (isActive?: boolean): 'default' | 'success' | 'danger' => {
    if (isActive) return "success";
    return "danger";
  };

  const getStatusLabel = (isActive?: boolean) => {
    if (isActive) return "Active";
    return "Inactive";
  };

  const formatRating = (rating?: number | string | null) => {
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
              <h3 className="text-xl font-bold ">
                Error Loading Products
              </h3>
              <p className=" max-w-md mx-auto">{error.message}</p>
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
      <PageHeader
        icon={<Package />}
        title="Products"
        description="Manage your product inventory"
        action={{ label: "Create", onClick: handleCreateNew }}
      />

      {/* Filters - Only show when there are products or when filters are active */}
      {(products.length > 0 || hasActiveFilters) && (
        <Card>
          <h2 className="text-lg font-semibold ">Filters</h2>
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
      )}

      {/* Products Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12"></div>
          <div className=" font-medium">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No products found"
          description="Try adjusting your filters or add new products"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow isHeader>
              <TableHead>#</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  {product.id}
                </TableCell>
                <TableCell>
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
                    {product.primary_image?.url ? (
                      <Image
                        src={product.primary_image.url}
                        alt={product.primary_image.alt_text || product.name_en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex flex-col">
                    <span className="truncate">{product.name_en}</span>
                    <span className="text-sm text-gray-500 truncate">{product.name_ar}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {product.category?.name_en || product.category?.name || <span className="text-gray-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {product.vendor?.name_en || product.vendor?.name || <span className="text-gray-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{product.stock?.total_quantity ?? <span className="text-gray-400">—</span>}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-start gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{formatRating(product.average_rating)}</span>
                    {product.total_ratings ? (
                      <span className="text-xs text-gray-500">({product.total_ratings})</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(product.is_active)}>
                    {getStatusLabel(product.is_active)}
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
                        handleDeleteClick(product);
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

      {/* Pagination - Only show when there are products */}
      {products.length > 0 && data?.data.pagination && (
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
      )}

      {/* Product View Modal */}
      <ProductViewModal
        isOpen={!!viewProductId}
        onClose={handleCloseViewModal}
        product={viewProductData?.data || null}
        onEdit={() => {
          handleCloseViewModal();
          if (viewProductId) {
            router.push(`/products/${viewProductId}`);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
}

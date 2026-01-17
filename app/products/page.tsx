"use client";

/**
 * Products Page
 * Main page component for displaying and managing products
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
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
  const { setShowOverlay } = useLoading();
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

  // Show loading overlay while data is loading
  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

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

  const getVisibilityVariant = (
    visible?: boolean
  ): "default" | "success" | "danger" => {
    if (visible) return "success";
    return "danger";
  };

  const getVisibilityLabel = (visible?: boolean) => {
    if (visible) return "Visible";
    return "Hidden";
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
      {!isLoading && products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No products found"
          description="Try adjusting your filters or add new products"
        />
      ) : !isLoading && (
        <Table>
          <TableHeader>
            <TableRow isHeader>
              <TableHead width="5%">#</TableHead>
              <TableHead width="7%">Image</TableHead>
              <TableHead width="12%">Product Name</TableHead>
              <TableHead width="9%">Category</TableHead>
              <TableHead width="11%">Brand</TableHead>
              <TableHead width="11%">Vendor</TableHead>
              <TableHead width="9%">Price</TableHead>
              <TableHead width="9%">Stock</TableHead>
              <TableHead width="9%">Rating</TableHead>
              <TableHead width="9%">Visibility</TableHead>
              <TableHead width="9%">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
               // Helper to find image
               const imageUrl = product.variants?.length && product.variants[0].media?.url 
                 ? product.variants[0].media.url 
                 : (product.media?.length ? product.media[0].image?.url : null);

               return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  {product.id}
                </TableCell>
                <TableCell>
                  <div className="w-15 h-15 relative rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name_en || ""}
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
                    <span className="truncate" title={product.name_en}>{product.name_en}</span>
                    <span className="text-sm text-gray-500 truncate" title={product.name_ar}>{product.name_ar}</span>
                  </div>
                </TableCell>
                <TableCell>
                    {product.categories && product.categories.length > 0 ? (
                       <Badge variant="default2" className="w-fit">
                         {product.categories[0].name_en}
                       </Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                </TableCell>
                <TableCell>
                   {(product.brand?.name_en || product.brand?.logo) ? (
                      <div className="flex items-center gap-2">
                         {product.brand.logo && (
                            <div className="w-15 h-15 relative overflow-hidden border border-primary/20 rounded-lg">
                              <Image src={product.brand.logo} alt={product.brand.name_en || ""} fill className="object-contain" />
                            </div>
                         )}
                         <span className="text-sm">{product.brand.name_en || <span className="text-gray-400">—</span>}</span>
                      </div>
                   ) : (
                      <span className="text-gray-400">—</span>
                   )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.vendor?.logo && (
                       <div className="w-15 h-15 relative overflow-hidden border border-primary/20 rounded-lg">
                         <Image src={product.vendor.logo} alt={product.vendor.name_en || ""} fill className="object-contain" />
                       </div>
                    )}
                    <span className="text-sm">{product.vendor?.name_en || product.vendor?.name || <span className="text-gray-400">—</span>}</span>
                  </div>
                </TableCell>
                <TableCell>
                   {(() => {
                      const price = product.variants?.length 
                        ? product.variants[0].price 
                        : (Array.isArray(product.price) ? product.price[0] : product.price);
                      
                      if (!price) return <span className="text-gray-400">—</span>;

                      const regularPrice = typeof price === 'object' ? price.price : price;
                      const salePrice = typeof price === 'object' ? price.sale_price : product.sale_price;

                      return (
                        <div className="flex flex-col">
                          {salePrice ? (
                            <>
                              <span className="font-semibold">{salePrice}</span>
                              <span className="text-xs text-gray-500 line-through">{regularPrice}</span>
                            </>
                          ) : (
                             <span className="font-semibold">{regularPrice}</span>
                          )}
                        </div>
                      )
                   })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const stock = product.variants?.length 
                      ? product.variants.reduce((acc: number, v: any) => acc + (v.quantity || 0), 0)
                      : (product.quantity ?? 0);
                    
                    return (
                        <Badge variant={stock > 0 ? "success" : "danger"}>
                            {stock > 0 ? `${stock} in stock` : "Out of stock"}
                        </Badge>
                    )
                  })()}
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
                  <Badge
                    variant={getVisibilityVariant(
                      product.visible ?? product.is_active
                    )}
                  >
                    {getVisibilityLabel(product.visible ?? product.is_active)}
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
            );
          })}
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

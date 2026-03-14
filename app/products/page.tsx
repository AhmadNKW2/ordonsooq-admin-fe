"use client";

/**
 * Products Page
 * Main page component for displaying and managing products
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useSessionStoragePage } from "@/hooks/use-session-storage-page";
import { useLoading } from "../src/providers/loading-provider";
import Image from "next/image";
import { useProducts, useDeleteProduct, useProduct } from "../src/services/products/hooks/use-products";
import { Package, AlertCircle, Star } from "lucide-react";
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
import { ProductFilters, Product } from "../src/services/products/types/product.types";
import { ProductViewModal } from "../src/components/products/ProductViewModal";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";
import { DatePicker } from "../src/components/ui/date-picker";
import { CategoryTreeSelect } from "../src/components/products/CategoryTreeSelect";
import { Select } from "../src/components/ui/select";
import { useVendors } from "../src/services/vendors/hooks/use-vendors";
import { useBrands } from "../src/services/brands/hooks/use-brands";
import { useCategories } from "../src/services/categories/hooks/use-categories";
import { useCustomers } from "../src/services/customers/hooks/use-customers";

export default function ProductsPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();
  const {
    page: storedPage,
    setPage: setStoredPage,
    limit: storedLimit,
    setLimit: setStoredLimit,
  } = useSessionStoragePage("products");
  
  const [queryParams, setQueryParams] = useState<ProductFilters>({
    page: storedPage,
    limit: storedLimit,
  });

  // Persist current page and limit to storage whenever they change
  useEffect(() => {
    setStoredPage(queryParams.page ?? 1);
  }, [queryParams.page, setStoredPage]);

  useEffect(() => {
    if (queryParams.limit) {
      setStoredLimit(queryParams.limit);
    }
  }, [queryParams.limit, setStoredLimit]);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCreatedByIds, setSelectedCreatedByIds] = useState<string[]>([]);
  const [viewProductId, setViewProductId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data, isLoading, isError, error, refetch } =
    useProducts(queryParams);
  const deleteProduct = useDeleteProduct();

  // Dropdown data for filters
  const { data: vendorsData } = useVendors();
  const { data: brandsData } = useBrands();
  const categoriesData = useCategories();
  const { data: adminsData } = useCustomers({ role: ['admin', 'catalog_manager'], limit: 100 } as any);

  const vendorOptions = (vendorsData?.data ?? []).map((v: any) => ({
    value: String(v.id),
    label: v.name_en || v.name || String(v.id),
  }));
  const brandOptions = (brandsData?.data ?? []).map((b: any) => ({
    value: String(b.id),
    label: b.name_en || b.name || String(b.id),
  }));
  const categoryOptions = (categoriesData.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.name_en || c.name || String(c.id),
  }));
  const adminOptions = (adminsData?.data ?? []).map((a: any) => ({
    value: String(a.id),
    label: [a.firstName, a.lastName].filter(Boolean).join(' ') || a.email || String(a.id),
  }));

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

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    if (field === 'start_date') setStartDate(value);
    else setEndDate(value);
    handleFilterChange({ [field]: value || undefined });
  };

  const handleVendorChange = (value: string | string[]) => {
    const v = Array.isArray(value) ? value : [value].filter(Boolean);
    setSelectedVendorIds(v);
    handleFilterChange({ vendor_ids: v.length > 0 ? v.join(",") : undefined });
  };

  const handleBrandChange = (value: string | string[]) => {
    const v = Array.isArray(value) ? value : [value].filter(Boolean);
    setSelectedBrandIds(v);
    handleFilterChange({ brand_ids: v.length > 0 ? v.join(",") : undefined });
  };

  const handleCategoryChange = (ids: string[]) => {
    setSelectedCategoryIds(ids);
    handleFilterChange({ category_ids: ids.length > 0 ? ids.join(",") : undefined });
  };

  const handleCreatedByChange = (value: string | string[]) => {
    const v = Array.isArray(value) ? value : [value].filter(Boolean);
    setSelectedCreatedByIds(v);
    handleFilterChange({ created_by: v.length > 0 ? v.join(",") : undefined });
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedVendorIds([]);
    setSelectedBrandIds([]);
    setSelectedCategoryIds([]);
    setSelectedCreatedByIds([]);
    setQueryParams({ page: 1, limit: storedLimit });
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

  const formatCategoryName = (name: string | undefined) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    if (words.length <= 1) return name;
    return `${words[0]} ${words[1].slice(0, 3)}...`;
  };

  const formatRating = (rating?: number | string | null) => {
    if (!rating) return "0.0";
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
    return numRating.toFixed(1);
  };

  const getCreatedAtParts = (createdAt?: string | Date) => {
    if (!createdAt) return null;

    if (typeof createdAt === "string") {
      const isoMatch = createdAt.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
      );

      if (isoMatch) {
        const [, year, month, day, hour, minute, second = "0"] = isoMatch;
        const localWallClockDate = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second)
        );

        return {
          date: localWallClockDate.toLocaleDateString(),
          time: localWallClockDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }
    }

    const parsedDate = new Date(createdAt);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return {
      date: parsedDate.toLocaleDateString(),
      time: parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
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
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold ">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-danger hover:text-danger2"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-1/3 shrink-0">
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  label="Search"
                  variant="search"
                />
              </div>

              <div className="relative flex-1">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(v) => handleDateChange('start_date', v)}
                  max={endDate || todayStr}
                />
              </div>

              <div className="relative flex-1">
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(v) => handleDateChange('end_date', v)}
                  min={startDate || undefined}
                  max={todayStr}
                />
              </div>

              {adminOptions.length > 0 && (
                <div className="relative flex-1">
                  <Select
                    label="Created By"
                    value={selectedCreatedByIds}
                    onChange={handleCreatedByChange}
                    options={adminOptions}
                    search={adminOptions.length > 6}
                    multiple={true}
                    placeholder="All Admins"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {categoryOptions.length > 0 && (
                <div className="relative w-1/3 shrink-0 z-50">
                  <CategoryTreeSelect
                    categories={categoriesData.data ?? []}
                    selectedIds={selectedCategoryIds}
                    onChange={handleCategoryChange}
                    singleSelect={false}
                    label="Category"
                  />
                </div>
              )}

              {vendorOptions.length > 0 && (
                <div className="relative w-1/3">
                  <Select
                    label="Vendor"
                    value={selectedVendorIds}
                    onChange={handleVendorChange}
                    options={vendorOptions}
                    search={vendorOptions.length > 6}
                    multiple={true}
                    placeholder="All Vendors"
                  />
                </div>
              )}

              {brandOptions.length > 0 && (
                <div className="relative w-1/3">
                  <Select
                    label="Brand"
                    value={selectedBrandIds}
                    onChange={handleBrandChange}
                    options={brandOptions}
                    search={brandOptions.length > 6}
                    multiple={true}
                    placeholder="All Brands"
                  />
                </div>
              )}
            </div>
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
        <Table
          pagination={data?.data.pagination ? {
            currentPage: data.data.pagination.page,
            pageSize: data.data.pagination.limit,
            totalItems: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages,
            hasNextPage: data.data.pagination.page < data.data.pagination.totalPages,
            hasPreviousPage: data.data.pagination.page > 1,
          } : undefined}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        >
          <TableHeader>
            <TableRow isHeader>
              <TableHead width="4%">#</TableHead>
              <TableHead width="6%">Image</TableHead>
              <TableHead width="11%">Product Name</TableHead>
              <TableHead width="8%">Category</TableHead>
              <TableHead width="11%">Brand</TableHead>
              <TableHead width="11%">Vendor</TableHead>
              <TableHead width="5%">Price</TableHead>
              <TableHead width="7%">Stock</TableHead>
              <TableHead width="5%">Rating</TableHead>
              <TableHead width="7%">Created At</TableHead>
              <TableHead width="10%">Created By</TableHead>
              <TableHead width="7%">Visibility</TableHead>
              <TableHead width="8%">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
               // Helper to find image
               let imageUrl = null;
               
               // Try variants first
                if (product.variants?.length && product.media_groups) {
                  const firstVariant = product.variants[0];
                  // Ensure media_groups exists and has the key
                  if (product.media_groups[firstVariant.media_group_id]?.media?.length) {
                     imageUrl = product.media_groups[firstVariant.media_group_id].media[0].url;
                  }
                }
                
                // Fallback to simple product media groups
                if (!imageUrl && product.media_groups) {
                  const groupKeys = Object.keys(product.media_groups);
                  if (groupKeys.length > 0) {
                    const firstGroup = product.media_groups[groupKeys[0]];
                    if (firstGroup?.media?.length) {
                       // Try to find primary
                       const primary = firstGroup.media.find((m: any) => m.is_primary) || firstGroup.media[0];
                       imageUrl = primary.url;
                    }
                  }
                }

                // Fallback to legacy fields if any
                if (!imageUrl && product.image) imageUrl = product.image;
                if (!imageUrl && product.media && product.media.length > 0) imageUrl = product.media[0].url || product.media[0].image;

               return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  {product.id}
                </TableCell>
                <TableCell>
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
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
                       <span title={product.categories[0].name_en} className="block max-w-[90px]">
                         <Badge variant="default2" className="w-full whitespace-nowrap overflow-hidden text-ellipsis block">
                           {formatCategoryName(product.categories[0].name_en)}
                         </Badge>
                       </span>
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
                      let price = null;
                      let salePrice = null;

                      // Try variants first
                      if (product.variants?.length && product.price_groups) {
                        const firstVariant = product.variants[0];
                        const priceGroup = product.price_groups[firstVariant.price_group_id];
                        if (priceGroup) {
                          price = priceGroup.price;
                          salePrice = priceGroup.sale_price;
                        }
                      }
                      // Fallback to simple product price groups
                      else if (product.price_groups) {
                        const groupKeys = Object.keys(product.price_groups);
                        if (groupKeys.length > 0) {
                           const priceGroup = product.price_groups[groupKeys[0]];
                           price = priceGroup.price;
                           salePrice = priceGroup.sale_price;
                        }
                      }
                      // Legacy
                      else if (product.price) {
                         const p = product.price as any;
                         price = typeof p === 'object' ? p.price : p;
                         salePrice = typeof p === 'object' ? p.sale_price : product.sale_price;
                      }

                      if (!price) return <span className="text-gray-400">—</span>;

                      return (
                        <div className="flex flex-col">
                          {salePrice ? (
                            <>
                              <span className="font-semibold">{salePrice}</span>
                              <span className="text-xs text-gray-500 line-through">{price}</span>
                            </>
                          ) : (
                             <span className="font-semibold">{price}</span>
                          )}
                        </div>
                      )
                   })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const isOutOfStock = product.variants?.length
                      ? product.variants.every((v: any) => v.is_out_of_stock === true)
                      : (product.is_out_of_stock === true);

                    return (
                        <Badge variant={isOutOfStock ? "danger" : "success"}>
                            {isOutOfStock ? "Out of Stock" : "In Stock"}
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
                  {(() => {
                    const createdAtParts = getCreatedAtParts(
                      product.created_at || (product as any).createdAt
                    );

                    if (!createdAtParts) {
                      return <span className="text-gray-400">—</span>;
                    }

                    return (
                      <div className="flex flex-col leading-tight">
                        <span>{createdAtParts.date}</span>
                        <span className="text-xs text-gray-500">{createdAtParts.time}</span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {product.created_by ? (
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {[product.created_by.firstName, product.created_by.lastName].filter(Boolean).join(" ") || "Unknown Creator"}
                      </span>
                      {product.created_by.email && (
                        <span className="text-xs text-gray-500 truncate" title={product.created_by.email}>
                          {product.created_by.email}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
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
                      href={`/products/${product.id}/view`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // handleView(product); // Just use href for right click if possible, actually handleView probably opens modal
                        handleView(product);
                      }}
                      title="View product"
                    />
                    <IconButton
                      variant="edit"
                      href={`/products/${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
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

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
import { useProducts, useDeleteProduct, useProduct, useToggleProductStatus } from "../src/services/products/hooks/use-products";
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

  const [queryParams, setQueryParams] = useState<ProductFilters>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("products_filters");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...parsed, page: storedPage, limit: storedLimit };
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    return {
      page: storedPage,
      limit: storedLimit,
    };
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

  // Persist filters to storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const { page, limit, ...filtersToStore } = queryParams;
      sessionStorage.setItem("products_filters", JSON.stringify(filtersToStore));
    }
  }, [queryParams]);

  const [searchTerm, setSearchTerm] = useState(queryParams.search || "");
  const [minPrice, setMinPrice] = useState(queryParams.minPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(queryParams.maxPrice?.toString() || "");
  const [startDate, setStartDate] = useState(queryParams.start_date || "");
  const [endDate, setEndDate] = useState(queryParams.end_date || "");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(queryParams.vendor_ids?.split(",") || []);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(queryParams.brand_ids?.split(",") || []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(queryParams.category_ids?.split(",") || []);
  const [selectedCreatedByIds, setSelectedCreatedByIds] = useState<string[]>(queryParams.created_by?.split(",") || []);
  const [viewProductId, setViewProductId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } =
    useProducts(queryParams);
  const deleteProduct = useDeleteProduct();
  const toggleProductStatus = useToggleProductStatus();

  const handleToggleVisibility = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      await toggleProductStatus.mutateAsync({
        id: product.id,
        visible: !(product.visible ?? product.is_active)
      });
    } catch (err) {
      console.error('Failed to update visibility', err);
    }
  };

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

  const products = data?.data.data || [];

  // Show loading overlay while data is loading
  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  // Handle highlighting and scrolling to last viewed product
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const id = sessionStorage.getItem('highlighted_product_id');
      if (id) {
        setHighlightedProductId(id);

        // Wait a small moment for the DOM to fully render the table rows
        setTimeout(() => {
          const element = document.getElementById(`product-row-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            sessionStorage.removeItem('highlighted_product_id'); // Clear it to prevent re-highlighting on next visits
          }
        }, 300);
      }
    }
  }, [isLoading, products.length]);

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
    // Truncate search to avoid URI Too Long error from huge copy-paste strings
    const safeValue = value.slice(0, 150);
    setSearchTerm(safeValue);
  };

  // Debounce search term changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm !== (queryParams.search || "")) {
        setQueryParams((prev) => ({
          ...prev,
          search: searchTerm || undefined,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, queryParams.search]);

  // Debounce price changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      const numMin = minPrice ? Number(minPrice) : undefined;
      const numMax = maxPrice ? Number(maxPrice) : undefined;

      if (numMin !== queryParams.minPrice || numMax !== queryParams.maxPrice) {
        setQueryParams((prev) => ({
          ...prev,
          minPrice: numMin,
          maxPrice: numMax,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [minPrice, maxPrice, queryParams.minPrice, queryParams.maxPrice]);

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

  const handleStockChange = (value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    let in_stock = undefined;
    if (val === 'true') in_stock = true;
    else if (val === 'false') in_stock = false;
    handleFilterChange({ in_stock });
  };

  const handleVisibilityChange = (value: string | string[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    let visible = undefined;
    if (val === 'true') visible = true;
    else if (val === 'false') visible = false;
    handleFilterChange({ visible });
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
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
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              label="Search"
              variant="search"
              maxLength={150}
            />

            <div className="flex items-center gap-4">
              <div className="relative flex-1 z-50">
                  <CategoryTreeSelect
                    categories={categoriesData.data ?? []}
                    selectedIds={selectedCategoryIds}
                    onChange={handleCategoryChange}
                    singleSelect={false}
                    label="Category" disabled={categoryOptions.length === 0} />
                </div>

              <div className="relative flex-1">
                  <Select
                    label="Vendor"
                    value={selectedVendorIds}
                    onChange={handleVendorChange}
                    options={vendorOptions}
                    search={vendorOptions.length > 6}
                    multiple={true}
                    placeholder="All Vendors" disabled={vendorOptions.length === 0} />
                </div>

              <div className="relative flex-1">
                  <Select
                    label="Brand"
                    value={selectedBrandIds}
                    onChange={handleBrandChange}
                    options={brandOptions}
                    search={brandOptions.length > 6}
                    multiple={true}
                    placeholder="All Brands" disabled={brandOptions.length === 0} />
                </div>
            </div>


            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <DatePicker
                  label="Create Start Date"
                  value={startDate}
                  onChange={(v) => handleDateChange('start_date', v)}
                  max={endDate || todayStr}
                />
              </div>

              <div className="relative flex-1">
                <DatePicker
                  label="Create End Date"
                  value={endDate}
                  onChange={(v) => handleDateChange('end_date', v)}
                  min={startDate || undefined}
                  max={todayStr}
                />
              </div>

              <div className="relative flex-1">
                  <Select
                    label="Created By"
                    value={selectedCreatedByIds}
                    onChange={handleCreatedByChange}
                    options={adminOptions}
                    search={adminOptions.length > 6}
                    multiple={true}
                    placeholder="All Admins" disabled={adminOptions.length === 0} />
                </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Select
                  label="Stock"
                  value={queryParams.in_stock === true ? "true" : queryParams.in_stock === false ? "false" : ""}
                  onChange={handleStockChange}
                  options={[
                    { value: "true", label: "In Stock" },
                    { value: "false", label: "Out of Stock" }
                  ]}
                  onClear={() => handleStockChange("")}
                  multiple={false}
                  placeholder="All Stock Status"
                />
              </div>
              <div className="relative flex-1">
                <Select
                  label="Visibility"
                  value={queryParams.visible === true ? "true" : queryParams.visible === false ? "false" : ""}
                  onChange={handleVisibilityChange}
                  options={[
                    { value: "true", label: "Visible" },
                    { value: "false", label: "Hidden" }
                  ]}
                  onClear={() => handleVisibilityChange("")}
                  multiple={false}
                  placeholder="All Visibility"
                />
              </div>
              <div className="relative flex-1">
                <Input
                  label="Min Price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0.00"
                  min={0}
                />
              </div>
              <div className="relative flex-1">
                <Input
                  label="Max Price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="0.00"
                  min={0}
                />
              </div>
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

              // 1. Try to find explicitly primary image across all media groups
              if (product.media_groups) {
                for (const key in product.media_groups) {
                  const group = product.media_groups[key];
                  if (group?.media?.length) {
                    const primaryMedia = group.media.find((m: any) => m.is_primary);
                    if (primaryMedia) {
                      imageUrl = primaryMedia.url;
                      break;
                    }
                  }
                }
              }

              // 2. Try variants first if no primary found
              if (!imageUrl && product.variants?.length && product.media_groups) {
                const firstVariant = product.variants[0];
                // Ensure media_groups exists and has the key
                if (product.media_groups[firstVariant.media_group_id]?.media?.length) {
                  imageUrl = product.media_groups[firstVariant.media_group_id].media[0].url;
                }
              }

              // 3. Fallback to simple product media groups
              if (!imageUrl && product.media_groups) {
                const groupKeys = Object.keys(product.media_groups);
                if (groupKeys.length > 0) {
                  const firstGroup = product.media_groups[groupKeys[0]];
                  if (firstGroup?.media?.length) {
                    imageUrl = firstGroup.media[0].url;
                  }
                }
              }

              // 4. Fallback to legacy fields if any

              return (
                <TableRow
                  key={product.id}
                  id={`product-row-${product.id}`}
                  className={highlightedProductId === product.id.toString() ? "bg-secondary/10 transition-colors duration-500" : ""}
                >
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
                    <div
                      onClick={(e) => handleToggleVisibility(e, product)}
                      className="cursor-pointer inline-block transition-opacity hover:opacity-80"
                      title="Click to toggle visibility"
                    >
                      <Badge
                        variant={getVisibilityVariant(
                          product.visible ?? product.is_active
                        )}
                      >
                        {getVisibilityLabel(product.visible ?? product.is_active)}
                      </Badge>
                    </div>
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
                          sessionStorage.setItem('highlighted_product_id', product.id.toString());
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
            sessionStorage.setItem('highlighted_product_id', viewProductId.toString());
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






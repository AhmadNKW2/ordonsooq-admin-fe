/**
 * Product Selection Modal Component
 * Reusable modal for selecting products with the same table as the products page
 * Includes search, filters, pagination, and checkbox selection
 */

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Package, X, Star, Search, Filter } from "lucide-react";
import { Modal } from "../ui/modal";
import { ProductViewModal } from "../products/ProductViewModal";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Pagination } from "../ui/pagination";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/table";
import { Select } from "../ui/select";
import { DatePicker } from "../ui/date-picker";
import { CategoryTreeSelect } from "../products/CategoryTreeSelect";
import { useVendors } from "../../services/vendors/hooks/use-vendors";
import { useBrands } from "../../services/brands/hooks/use-brands";
import { useCategories } from "../../services/categories/hooks/use-categories";
import { useCustomers } from "../../services/customers/hooks/use-customers";
import { useProducts, useProduct } from "../../services/products/hooks/use-products";
import { Product, ProductFilters } from "../../services/products/types/product.types";
import { PAGINATION } from "../../lib/constants";

export interface SelectedProduct {
    id: number;
    name_en: string;
    name_ar: string;
    sku?: string;
    primary_image?: { url: string; alt_text?: string | null } | null;
    price?: string | null;
    category?: { name?: string; name_en?: string } | null;
    vendor?: { name?: string; name_en?: string } | null;
}

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProductIds: number[];
    onSelectionChange: (productIds: number[]) => void;
    title?: string;
    excludeProductIds?: number[];
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
    isOpen,
    onClose,
    selectedProductIds,
    onSelectionChange,
    title = "Manage Products",
    excludeProductIds = [],
}) => {
    const [queryParams, setQueryParams] = useState<ProductFilters>({
        page: PAGINATION.defaultPage,
        limit: PAGINATION.defaultPageSize,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [viewProductId, setViewProductId] = useState<number | null>(null);

    const { data: viewProductData, isLoading: isLoadingViewProduct } = useProduct(
        viewProductId || 0,
        { enabled: !!viewProductId }
    );
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [selectedCreatedByIds, setSelectedCreatedByIds] = useState<string[]>([]);
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedProductIds);

    // Filter dropdown data
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

    // Generate max dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Debounced hook effect for min/max prices
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setQueryParams(prev => ({
                ...prev,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                page: 1
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [minPrice, maxPrice]);

    // Handle filter changes methods
    const handleCategoryChange = (ids: string[]) => {
        setSelectedCategoryIds(ids);

        let categoryParam = ids.length ? ids.join(',') : undefined;
        let exactCategoryId = undefined;
        if (ids.includes('none')) {
            categoryParam = undefined;
            exactCategoryId = 'none';
        }
        
        setQueryParams(prev => ({ 
            ...prev, 
            category_ids: categoryParam,
            ...(exactCategoryId ? { categoryId: exactCategoryId } : { categoryId: undefined }), 
            page: 1 
        }));
    };

    const categoryTreeData = useMemo(() => {
        const baseOptions = categoriesData?.data ?? [];
        return [
            { id: 'none', name_en: 'No Category', name_ar: 'بدون فئة', parent_id: null, children: [] } as any,
            ...baseOptions
        ];
    }, [categoriesData?.data]);

    const handleVendorChange = (value: string | string[]) => {
        const v = Array.isArray(value) ? value : [value].filter(Boolean);
        setSelectedVendorIds(v);
        setQueryParams(prev => ({ ...prev, vendor_ids: v.length ? v.join(',') : undefined, page: 1 }));
    };

    const handleBrandChange = (value: string | string[]) => {
        const v = Array.isArray(value) ? value : [value].filter(Boolean);
        setSelectedBrandIds(v);
        setQueryParams(prev => ({ ...prev, brand_ids: v.length ? v.join(',') : undefined, page: 1 }));
    };

    const handleCreatedByChange = (value: string | string[]) => {
        const v = Array.isArray(value) ? value : [value].filter(Boolean);
        setSelectedCreatedByIds(v);
        setQueryParams(prev => ({ ...prev, created_by: v.length ? v.join(',') : undefined, page: 1 }));
    };

    const handleStockChange = (value: string | string[]) => {
        const val = typeof value === 'string' ? value : value[0];
        const in_stock = val === 'true' ? true : val === 'false' ? false : undefined;
        setQueryParams((prev) => ({ ...prev, in_stock, page: 1 }));
    };

    const handleVisibilityChange = (value: string | string[]) => {
        const val = typeof value === 'string' ? value : value[0];
        const visible = val === 'true' ? true : val === 'false' ? false : undefined;
        setQueryParams((prev) => ({ ...prev, visible, page: 1 }));
    };

    const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
        if (field === 'start_date') {
            setStartDate(value);
        } else {
            setEndDate(value);
        }
        setQueryParams(prev => ({
            ...prev,
            [field]: value || undefined,
            page: 1
        }));
    };

    // Fetch products
    const { data, isLoading } = useProducts(queryParams, { enabled: isOpen });

    const products = data?.data?.data || [];
    const pagination = data?.data?.pagination;

    // Filter out excluded products
    const filteredProducts = useMemo(() => {
        return products.filter(p => !excludeProductIds.includes(p.id));
    }, [products, excludeProductIds]);

    // Reset local selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setLocalSelectedIds(selectedProductIds);
        }
    }, [isOpen, selectedProductIds]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        const debounce = setTimeout(() => {
            if (value !== queryParams.search) {
                setQueryParams(prev => ({ ...prev, search: value || undefined, page: 1 }));
            }
        }, 300);
        return () => clearTimeout(debounce);
    };

    const handlePageChange = (page: number) => {
        setQueryParams(prev => ({ ...prev, page }));
    };

    const handlePageSizeChange = (pageSize: number) => {
        setQueryParams(prev => ({ ...prev, limit: pageSize, page: 1 }));
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setMinPrice("");
        setMaxPrice("");
        setStartDate("");
        setEndDate("");
        setSelectedVendorIds([]);
        setSelectedBrandIds([]);
        setSelectedCategoryIds([]);
        setSelectedCreatedByIds([]);
        setQueryParams({
            page: PAGINATION.defaultPage,
            limit: PAGINATION.defaultPageSize,
        });
    };

    const handleToggleProduct = (productId: number) => {
        setLocalSelectedIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSelectAll = () => {
        const currentPageIds = filteredProducts.map(p => p.id);
        const allSelected = currentPageIds.every(id => localSelectedIds.includes(id));

        if (allSelected) {
            // Deselect all on current page
            setLocalSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            // Select all on current page
            setLocalSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleSave = () => {
        onSelectionChange(localSelectedIds);
        onClose();
    };

    const handleCancel = () => {
        setLocalSelectedIds(selectedProductIds);
        onClose();
    };

    const getVisibilityVariant = (visible?: boolean): 'default' | 'success' | 'danger' => {
        return visible ? "success" : "danger";
    };

    const getVisibilityLabel = (visible?: boolean) => {
        return visible ? "Visible" : "Hidden";
    };

    const formatRating = (rating?: number | string | null) => {
        if (!rating) return "0.0";
        const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
        return numRating.toFixed(1);
    };

    const hasActiveFilters = Object.keys(queryParams).some(
        (key) => queryParams[key as keyof ProductFilters] !== undefined && key !== 'page' && key !== 'limit'
    );
    const currentPageIds = filteredProducts.map(p => p.id);
    const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => localSelectedIds.includes(id));
    const someCurrentPageSelected = currentPageIds.some(id => localSelectedIds.includes(id));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            className="w-full max-w-[98vw] h-[95vh]"
            contentClassName="gap-5 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full gap-30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <p className="text-sm text-gray-500">
                            {localSelectedIds.length} product{localSelectedIds.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-3">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>

            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg w-full">
                    <Package className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1">
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                label="Search"
                                variant="search"
                            />
                        </div>
                        <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>
                            Filters {hasActiveFilters ? '(Active)' : ''}
                        </Button>
                    </div>

                    <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} className="max-w-5xl w-full" scrollable={false}>
                        <h3 className="text-xl font-bold mb-4">Filters</h3>
                        <div className="flex flex-col gap-4 w-full">

                        <div className="flex items-center gap-4 w-full mt-2">
                            <div className="relative flex-1 z-[60]">
                                <CategoryTreeSelect
                                        categories={categoryTreeData}
                                        selectedIds={selectedCategoryIds}
                                        onChange={handleCategoryChange}
                                        singleSelect={false}
                                        label="Category" disabled={categoryTreeData.length <= 1} />
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

                        <div className="flex items-center gap-4 w-full">
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

                        <div className="flex items-center gap-4 w-full">
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

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear All
                            </Button>
                            <Button onClick={() => setIsFilterModalOpen(false)}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </Modal>

                    <div className="flex-1 overflow-hidden flex flex-col w-full shadow-sm rounded-lg">
                        <Table
                            wrapperClassName="h-full flex flex-col min-h-0"
                            innerWrapperClassName="flex-1 overflow-auto"
                            className="min-w-[1000px]"
                            pagination={pagination ? {
                            currentPage: pagination.page,
                            pageSize: pagination.limit,
                            totalItems: pagination.total,
                            totalPages: pagination.totalPages,
                            hasNextPage: pagination.page < pagination.totalPages,
                            hasPreviousPage: pagination.page > 1,
                        } : undefined}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    >
                        <TableHeader>
                            <TableRow isHeader>
                                <TableHead width="4%">
                                    <Checkbox
                                        checked={allCurrentPageSelected}
                                        onChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead width="4%">#</TableHead>
                                <TableHead width="5%">Image</TableHead>
                                <TableHead width="19%">Product Name</TableHead>
                                <TableHead width="10%">Category</TableHead>
                                <TableHead width="13%">Brand</TableHead>
                                <TableHead width="13%">Vendor</TableHead>
                                <TableHead width="8%">Price</TableHead>
                                <TableHead width="9%">Stock</TableHead>
                                <TableHead width="6%">Rating</TableHead>
                                <TableHead width="6%">Visibility</TableHead>
                                <TableHead width="8%">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => {
                                // 1. Determine Image URL
                                let imageUrl: string | null = null;
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
                                if (!imageUrl && product.variants?.length && product.media_groups) {
                                  const firstVariant = product.variants[0] as any;
                                  if (product.media_groups[firstVariant.media_group_id]?.media?.length) {
                                    imageUrl = product.media_groups[firstVariant.media_group_id].media[0].url;
                                  }
                                }
                                if (!imageUrl && product.media_groups) {
                                  const groupKeys = Object.keys(product.media_groups);
                                  if (groupKeys.length > 0) {
                                    const firstGroup = product.media_groups[groupKeys[0]];
                                    if (firstGroup?.media?.length) {
                                      imageUrl = firstGroup.media[0].url;
                                    }
                                  }
                                }
                                
                                // 2. Determine Price Logic
                                let displayBasePrice: number | null = null;
                                let displaySalePrice: number | null = null;
                                if (product.variants?.length && product.price_groups) {
                                    const firstVariant = product.variants[0] as any;
                                    const priceGroup = product.price_groups[firstVariant.price_group_id];
                                    if (priceGroup) {
                                        displayBasePrice = typeof priceGroup.price === 'string' ? parseFloat(priceGroup.price) : priceGroup.price;
                                        displaySalePrice = priceGroup.sale_price ? (typeof priceGroup.sale_price === 'string' ? parseFloat(priceGroup.sale_price) : priceGroup.sale_price) : null;
                                    }
                                } else if (product.price_groups) {
                                    const groupKeys = Object.keys(product.price_groups);
                                    if (groupKeys.length > 0) {
                                        const priceGroup = product.price_groups[groupKeys[0]];
                                        displayBasePrice = typeof priceGroup.price === 'string' ? parseFloat(priceGroup.price) : priceGroup.price;
                                        displaySalePrice = priceGroup.sale_price ? (typeof priceGroup.sale_price === 'string' ? parseFloat(priceGroup.sale_price) : priceGroup.sale_price) : null;
                                    }
                                } else if (product.price) {
                                    const p = product.price as any;
                                    displayBasePrice = typeof p === 'object' ? parseFloat(p.price) : parseFloat(p);
                                    displaySalePrice = typeof p === 'object' && p.sale_price ? parseFloat(p.sale_price) : (product.sale_price ? parseFloat(product.sale_price as string) : null);
                                }

                                // 3. Determine Stock logic
                                const isOutOfStock = product.variants?.length
                                  ? product.variants.every((v: any) => v.is_out_of_stock === true)
                                  : (product.is_out_of_stock === true);
                                  
                                const totalQuantity = product.variants?.length
                                    ? product.variants.reduce((acc: number, v: any) => acc + (v.quantity || 0), 0)
                                    : (product.quantity ?? 0);

                                return (
                                <TableRow
                                    key={product.id}
                                    className={`cursor-pointer transition-colors ${localSelectedIds.includes(product.id) ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                    onClick={() => handleToggleProduct(product.id)}
                                >
                                    <TableCell>
                                        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={localSelectedIds.includes(product.id)}
                                                onChange={() => handleToggleProduct(product.id)}
                                            />
                                        </div>
                                    </TableCell>
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
                                                    sizes="60px"
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
                                                        <Image src={product.brand.logo} alt={product.brand.name_en || ""} fill sizes="60px" className="object-contain" />
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
                                                    <Image src={product.vendor.logo} alt={product.vendor.name_en || ""} fill sizes="60px" className="object-contain" />
                                                </div>
                                            )}
                                            <span className="text-sm">{product.vendor?.name_en || product.vendor?.name || <span className="text-gray-400">—</span>}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {displayBasePrice != null ? (
                                            <div className="flex flex-col">
                                                {displaySalePrice && displaySalePrice < displayBasePrice ? (
                                                    <>
                                                        <span className="font-semibold text-sm">BHD {displaySalePrice.toFixed(3)}</span>
                                                        <span className="text-xs text-gray-500 line-through">BHD {displayBasePrice.toFixed(3)}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-semibold text-sm">BHD {displayBasePrice.toFixed(3)}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={isOutOfStock ? "danger" : "success"}>
                                            {isOutOfStock ? "Out of stock" : (totalQuantity > 0 ? `${totalQuantity} in stock` : "In stock")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-start gap-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold">{product.average_rating ? Number(product.average_rating).toFixed(1) : "0.0"}</span>
                                            {product.total_ratings ? (
                                                <span className="text-xs text-gray-500">({product.total_ratings})</span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getVisibilityVariant(product.visible ?? product.is_active)}>
                                            {getVisibilityLabel(product.visible ?? product.is_active)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div 
                                            className="flex items-center justify-center p-2" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                e.preventDefault();
                                            }}
                                        >
                                            <IconButton
                                                variant="view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setViewProductId(product.id);
                                                }}
                                                title="View Product"
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    </div>
                </>
            )
            }
            {viewProductId && (
                <ProductViewModal 
                    isOpen={!!viewProductId}
                    onClose={() => setViewProductId(null)} 
                    product={filteredProducts.find((p: any) => p.id === viewProductId) || null}
                />
            )}
        </Modal >
    );
};

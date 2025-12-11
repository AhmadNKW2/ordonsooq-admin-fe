/**
 * Product Selection Modal Component
 * Reusable modal for selecting products with the same table as the products page
 * Includes search, filters, pagination, and checkbox selection
 */

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Package, X, Star, Search } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
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
import { useProducts } from "../../services/products/hooks/use-products";
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
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedProductIds);

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

    const getStatusVariant = (isActive?: boolean): 'default' | 'success' | 'danger' => {
        return isActive ? "success" : "danger";
    };

    const getStatusLabel = (isActive?: boolean) => {
        return isActive ? "Active" : "Inactive";
    };

    const formatRating = (rating?: number | string | null) => {
        if (!rating) return "0.0";
        const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
        return numRating.toFixed(1);
    };

    const hasActiveFilters = !!queryParams.search;
    const currentPageIds = filteredProducts.map(p => p.id);
    const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => localSelectedIds.includes(id));
    const someCurrentPageSelected = currentPageIds.some(id => localSelectedIds.includes(id));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            className="max-w-6xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full">
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

            {/* Filters */}
            <div className="flex items-center gap-4">
                <Input
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    label="Search"
                    variant="search"
                />

                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="h-9"
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow isHeader>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allCurrentPageSelected}
                                    onChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow
                                key={product.id}
                                className={`cursor-pointer transition-colors ${localSelectedIds.includes(product.id) ? 'bg-primary/5' : 'hover:bg-gray-50'
                                    }`}
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
                                <TableCell className="font-semibold max-w-xs">
                                    <div className="flex flex-col">
                                        <span className="truncate">{product.name_en}</span>
                                        <span className="text-sm text-gray-500 truncate">{product.name_ar}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        {product.category?.name || <span className="text-gray-400">—</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        {product.vendor?.name || <span className="text-gray-400">—</span>}
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && pagination && (
                <Pagination
                    pagination={{
                        currentPage: pagination.page,
                        pageSize: pagination.limit,
                        totalItems: pagination.total,
                        totalPages: pagination.totalPages,
                        hasNextPage: pagination.page < pagination.totalPages,
                        hasPreviousPage: pagination.page > 1,
                    }}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    showPageSize={true}
                />
            )}
        </Modal>
    );
};

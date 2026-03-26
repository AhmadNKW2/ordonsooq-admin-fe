"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Pagination } from "../ui/pagination";
import { ProductSelectionModal } from "./ProductSelectionModal";
import { IconButton } from "../ui/icon-button";
import { Badge } from "../ui/badge";
import { STOREFRONT_CONFIG } from "../../lib/constants";

export interface ProductItem {
  id: number;
  name_en: string;
  name_ar: string;
  sku?: string;
  slug?: string | null;
  primary_image?: { url: string; alt_text?: string | null } | null;
  price?: string | null;
  category?: { name?: string; name_en?: string } | null;
  vendor?: { name?: string; name_en?: string } | null;
  visible?: boolean;
}

interface ProductsTableSectionProps {
  title?: string;
  products: ProductItem[];
  onProductsChange: (product_ids: number[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  editButtonText?: string;
  modalTitle?: string;
  allProducts?: ProductItem[];
  addButtonText?: string;
}

export const ProductsTableSection: React.FC<ProductsTableSectionProps> = ({
  title = "Products",
  products,
  onProductsChange,
  isLoading = false,
  emptyMessage = "No products assigned",
  editButtonText = "Manage Products",
  modalTitle = "Select Products",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const currentProductIds = useMemo(() => products.map((p) => p.id), [products]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return products.slice(startIndex, startIndex + pageSize);
  }, [products, page, pageSize]);

  const totalPages = Math.ceil(products.length / pageSize) || 1;

  const handleSelectionChange = (productIds: number[]) => {
    onProductsChange(productIds);
  };

  const handlePreview = (slug?: string | null) => {
    if (!slug) return;

    window.open(
      `${STOREFRONT_CONFIG.baseUrl}/products/${slug}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title} <Badge variant="secondary" className="ml-2">{products.length}</Badge></h3>
        <Button variant="solid" onClick={() => setIsModalOpen(true)} disabled={isLoading}>
          {editButtonText}
        </Button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-3">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">{emptyMessage}</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-2 text-primary hover:underline">
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table noPagination={true}>
            <TableHeader>
              <TableRow isHeader>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {product.primary_image?.url ? (
                          <Image
                            src={product.primary_image.url}
                            alt={product.primary_image.alt_text || product.name_en}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm line-clamp-1">{product.name_en}</span>
                        <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.name_ar}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.sku ? (
                       <Badge variant="default" className="font-mono text-xs text-gray-600 bg-gray-50">{product.sku}</Badge>
                    ) : (
                       <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm">
                      {product.price ? `$${parseFloat(product.price).toFixed(2)}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                       <IconButton 
                          title={product.slug ? "Preview product" : "Preview unavailable"}
                          variant="view" 
                          disabled={!product.slug}
                          onClick={() => handlePreview(product.slug)}
                       />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="border-t border-gray-100">
                             <Pagination
                 pagination={{
                   currentPage: page,
                   totalPages: totalPages,
                   pageSize: pageSize,
                   totalItems: products.length,
                   hasNextPage: page < totalPages,
                   hasPreviousPage: page > 1
                 }}
                 onPageChange={setPage}
               />
            </div>
          )}
        </div>
      )}

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedProductIds={currentProductIds}
        onSelectionChange={handleSelectionChange}
        title={modalTitle}
      />
    </div>
  );
};











/**
 * Products Table Section Component
 * Reusable component for displaying products in a table with edit functionality
 * Uses ProductSelectionModal for adding/removing products
 * Used in CategoryForm, VendorForm, and CustomerForm
 */

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Package, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { ProductSelectionModal } from "./ProductSelectionModal";

export interface ProductItem {
  id: number;
  name_en: string;
  name_ar: string;
  sku?: string;
  primary_image?: { url: string; alt_text?: string | null } | null;
  price?: string | null;
  category?: { name?: string; name_en?: string } | null;
  vendor?: { name?: string; name_en?: string } | null;
}

interface ProductsTableSectionProps {
  title?: string;
  products: ProductItem[];
  onProductsChange: (product_ids: number[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  editButtonText?: string;
  modalTitle?: string;
  /** @deprecated No longer used - modal fetches products directly */
  allProducts?: ProductItem[];
  /** @deprecated Use editButtonText instead */
  addButtonText?: string;
}

export const ProductsTableSection: React.FC<ProductsTableSectionProps> = ({
  title = "Products",
  products,
  onProductsChange,
  isLoading = false,
  emptyMessage = "No products assigned",
  editButtonText = "Edit Products",
  modalTitle = "Manage Products",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current product IDs
  const currentProductIds = useMemo(() => products.map((p) => p.id), [products]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectionChange = (productIds: number[]) => {
    onProductsChange(productIds);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title} ({products.length})</h3>
        <Button variant="outline" onClick={handleOpenModal} disabled={isLoading}>
          {editButtonText}
        </Button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Package className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow isHeader>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {product.primary_image?.url ? (
                      <Image
                        src={product.primary_image.url}
                        alt={product.primary_image.alt_text || product.name_en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-xs">{product.name_en}</span>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {product.name_ar}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-gray-600">
                    {product.sku || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {product.price ? `$${product.price}` : "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedProductIds={currentProductIds}
        onSelectionChange={handleSelectionChange}
        title={modalTitle}
      />
    </div>
  );
};

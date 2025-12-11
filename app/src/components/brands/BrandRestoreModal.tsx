/**
 * Brand Restore Modal Component
 * Matches vendor restore flow for archived products handling
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  RotateCcw,
  Tags,
  Package,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  PackageCheck,
  PackageX,
} from "lucide-react";
import {
  RestoreBrandDto,
  ArchivedBrandProduct,
  Brand,
} from "../../services/brands/types/brand.types";

interface BrandRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RestoreBrandDto) => void;
  brand: Brand | null;
  isLoading?: boolean;
}

export const BrandRestoreModal: React.FC<BrandRestoreModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  brand,
  isLoading = false,
}) => {
  const [restoreOption, setRestoreOption] = useState<"none" | "all" | "select">("none");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showProducts, setShowProducts] = useState(false);

  const lastBrandRef = useRef(brand);

  useEffect(() => {
    if (brand) {
      lastBrandRef.current = brand;
    }
  }, [brand]);

  useEffect(() => {
    if (isOpen) {
      setRestoreOption("none");
      setSelectedProducts([]);
      setShowProducts(false);
    }
  }, [isOpen]);

  const displayBrand = brand || lastBrandRef.current;

  if (!displayBrand) return null;

  const archivedProducts = displayBrand.archivedProducts || [];
  const hasArchivedProducts = archivedProducts.length > 0;

  const handleConfirm = () => {
    const data: RestoreBrandDto = {};
    if (restoreOption === "all") {
      data.restoreAllProducts = true;
    } else if (restoreOption === "select" && selectedProducts.length > 0) {
      data.product_ids = selectedProducts;
    }
    onConfirm(data);
  };

  const handleProductToggle = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === archivedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(archivedProducts.map((p) => p.id));
    }
  };

  const isConfirmDisabled =
    isLoading || (restoreOption === "select" && selectedProducts.length === 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-br from-green-100 to-emerald-100 shadow-sm">
        <RotateCcw className="w-7 h-7 text-green-600" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Restore Brand</h2>
        <p className="text-sm text-gray-500 mt-1">
          Bring this brand back to active status
        </p>
      </div>

      <div className="w-full flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
        {displayBrand.logo ? (
          <div className="w-14 h-14 relative rounded-xl overflow-hidden border-2 border-white shadow-sm">
            <Image
              src={displayBrand.logo}
              alt={displayBrand.name_en}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary/10 to-primary/20 flex items-center justify-center border-2 border-white shadow-sm">
            <Tags className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {displayBrand.name_en}
          </div>
          {displayBrand.name_ar && (
            <div className="text-sm text-gray-500 truncate" dir="rtl">
              {displayBrand.name_ar}
            </div>
          )}
        </div>
      </div>

      {!hasArchivedProducts ? (
        <div className="w-full flex items-center gap-3 p-4 bg-blue-50/80 rounded-xl border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">No archived products</p>
            <p className="text-xs text-blue-600 mt-0.5">
              This brand has no archived products to restore.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Archived Products
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {archivedProducts.length} product{archivedProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                restoreOption === "none"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="restoreOption"
                checked={restoreOption === "none"}
                onChange={() => setRestoreOption("none")}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  restoreOption === "none"
                    ? "border-primary bg-primary"
                    : "border-gray-300"
                }`}
              >
                {restoreOption === "none" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <PackageX className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Don&apos;t restore any products
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                restoreOption === "all"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="restoreOption"
                checked={restoreOption === "all"}
                onChange={() => setRestoreOption("all")}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  restoreOption === "all"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}
              >
                {restoreOption === "all" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <Sparkles className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Restore all products
                </span>
                <span className="ml-2 text-xs text-green-600 font-medium">
                  ({archivedProducts.length})
                </span>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                restoreOption === "select"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="restoreOption"
                checked={restoreOption === "select"}
                onChange={() => setRestoreOption("select")}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  restoreOption === "select"
                    ? "border-amber-500 bg-amber-500"
                    : "border-gray-300"
                }`}
              >
                {restoreOption === "select" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <PackageCheck className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Restore selected products
                </span>
                <span className="ml-2 text-xs text-amber-600 font-medium">
                  ({selectedProducts.length}/{archivedProducts.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProducts((prev) => !prev)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-amber-200 text-amber-600 bg-white hover:bg-amber-50"
              >
                {showProducts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </label>
          </div>

          {showProducts && restoreOption === "select" && (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl divide-y divide-amber-200 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProducts.length === archivedProducts.length}
                    onChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-amber-800">
                    Select All
                  </span>
                </div>
                <span className="text-xs text-amber-700">
                  {selectedProducts.length} selected
                </span>
              </div>

              {archivedProducts.map((product: ArchivedBrandProduct) => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 p-3 hover:bg-white/60 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleProductToggle(product.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {product.name_en}
                    </div>
                    {product.name_ar && (
                      <div className="text-xs text-gray-500 truncate" dir="rtl">
                        {product.name_ar}
                      </div>
                    )}
                  </div>
                  <Package className="w-4 h-4 text-amber-500" />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
          {isLoading ? "Restoring..." : "Restore"}
        </Button>
      </div>
    </Modal>
  );
};

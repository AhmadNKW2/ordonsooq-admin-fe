/**
 * Brand Delete Modal Component
 * Mirrors vendor delete flow with product handling options
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectOption } from "../ui/select";
import {
  Trash2,
  Tags,
  AlertTriangle,
  Package,
  ArrowRightLeft,
  Flame,
  ShieldAlert,
} from "lucide-react";
import {
  PermanentDeleteBrandDto,
  Brand,
} from "../../services/brands/types/brand.types";

interface BrandDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PermanentDeleteBrandDto) => void;
  brand: Brand | null;
  allBrands?: Brand[];
  isLoading?: boolean;
}

export const BrandDeleteModal: React.FC<BrandDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  brand,
  allBrands = [],
  isLoading = false,
}) => {
  const [productOption, setProductOption] = useState<"delete" | "move">("delete");
  const [targetBrandId, setTargetBrandId] = useState<string>("");
  const [confirmInput, setConfirmInput] = useState("");
  const CONFIRM_WORD = "delete";

  const lastBrandRef = useRef(brand);

  useEffect(() => {
    if (brand) {
      lastBrandRef.current = brand;
    }
  }, [brand]);

  useEffect(() => {
    if (isOpen) {
      setProductOption("delete");
      setTargetBrandId("");
      setConfirmInput("");
    }
  }, [isOpen]);

  const displayBrand = brand || lastBrandRef.current;

  if (!displayBrand) return null;

  const archivedProducts = displayBrand.archivedProducts || [];
  const hasArchivedProducts = archivedProducts.length > 0;

  const availableBrands = allBrands.filter(
    (b) => b.id !== displayBrand.id && b.status !== "archived"
  );

  const brandOptions: SelectOption[] = availableBrands.map((b) => ({
    value: b.id.toString(),
    label: b.name_en,
  }));

  const isConfirmValid = confirmInput.toLowerCase() === CONFIRM_WORD;

  const handleConfirm = () => {
    if (!isConfirmValid) return;

    const data: PermanentDeleteBrandDto = {};
    if (hasArchivedProducts) {
      if (productOption === "delete") {
        data.deleteProducts = true;
      } else if (productOption === "move" && targetBrandId) {
        data.moveProductsToBrandId = parseInt(targetBrandId, 10);
      }
    }
    onConfirm(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isConfirmValid && !isLoading) {
      handleConfirm();
    }
  };

  const isButtonDisabled =
    isLoading ||
    !isConfirmValid ||
    (hasArchivedProducts && productOption === "move" && !targetBrandId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg w-full">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-br from-red-100 to-red-200 shadow-sm">
        <Trash2 className="w-7 h-7 text-red-600" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Permanently Delete Brand</h2>
        <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
      </div>

      <div className="w-full flex items-center gap-4 p-4 bg-linear-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200">
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
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-red-100 to-red-200 flex items-center justify-center border-2 border-white shadow-sm">
            <Tags className="w-6 h-6 text-red-500" />
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

      <div className="w-full flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800">Permanent Action</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This will permanently delete the brand and all its data.
            {hasArchivedProducts &&
              ` There are ${archivedProducts.length} archived product(s) that need to be handled.`}
          </p>
        </div>
      </div>

      {hasArchivedProducts && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Handle Archived Products
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {archivedProducts.length} product{archivedProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                productOption === "delete"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="productOption"
                checked={productOption === "delete"}
                onChange={() => setProductOption("delete")}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  productOption === "delete"
                    ? "border-red-500 bg-red-500"
                    : "border-gray-300"
                }`}
              >
                {productOption === "delete" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <Flame className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Delete all products permanently
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  All {archivedProducts.length} products will be deleted forever
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                productOption === "move"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="productOption"
                checked={productOption === "move"}
                onChange={() => setProductOption("move")}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  productOption === "move"
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-gray-300"
                }`}
              >
                {productOption === "move" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Move products to another brand
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Products will be reassigned before deletion
                </p>
              </div>
            </label>
          </div>

          {productOption === "move" && (
            <div className="space-y-2">
              <Select
                label="Select target brand"
                placeholder="Choose a brand"
                value={targetBrandId}
                onChange={(value) => setTargetBrandId(Array.isArray(value) ? value[0] : value)}
                options={brandOptions}
                error={
                  !targetBrandId && productOption === "move"
                    ? "Please select a brand to move products"
                    : undefined
                }
              />
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <ShieldAlert className="w-4 h-4 text-indigo-500 mt-0.5" />
                <p>
                  Products will be reassigned to the selected brand. This is recommended if the products should stay available.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Type "{CONFIRM_WORD}" to confirm
        </label>
        <Input
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={CONFIRM_WORD}
        />
        <p className="text-xs text-gray-500">
          This action is irreversible. Please type the confirmation word to proceed.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isButtonDisabled}
        >
          {isLoading ? "Deleting..." : "Delete Permanently"}
        </Button>
      </div>
    </Modal>
  );
};

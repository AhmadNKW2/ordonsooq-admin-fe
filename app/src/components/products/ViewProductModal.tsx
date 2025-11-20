/**
 * View Product Modal
 * Display product details in a modal
 */

"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Product } from "../../services/products/types/product.types";
import { Package, Tag, Star, Calendar, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categoryName?: string;
}

export const ViewProductModal: React.FC<ViewProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categoryName,
}) => {
  if (!product) return null;

  const InfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon && (
        <div className="shrink-0 mt-0.5 text-gray-500">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd className="text-sm text-third font-semibold wrap-break-word">{value}</dd>
      </div>
    </div>
  );

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRating = (rating?: number | null) => {
    if (!rating) return "No ratings yet";
    return `${rating.toFixed(1)} / 5.0`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-third mb-2">
              {product.name_en}
            </h3>
            {product.name_ar && (
              <p className="text-lg text-gray-600 mb-3" dir="rtl">
                {product.name_ar}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={product.is_active ? "success" : "danger"}>
                {product.is_active ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
              <Badge variant="default">
                {product.pricing_type === "single" ? "Single Price" : "Variant Pricing"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <h4 className="text-lg font-semibold text-third mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </h4>
          <dl className="space-y-0">
            <InfoRow
              label="SKU"
              value={product.sku || <span className="text-gray-400">Not set</span>}
              icon={<Tag className="h-4 w-4" />}
            />
            <InfoRow
              label="Category"
              value={categoryName || `Category ID: ${product.category_id}`}
              icon={<Package className="h-4 w-4" />}
            />
            {product.vendor_id && (
              <InfoRow
                label="Vendor ID"
                value={product.vendor_id}
                icon={<Package className="h-4 w-4" />}
              />
            )}
            <InfoRow
              label="Pricing Type"
              value={product.pricing_type === "single" ? "Single Price" : "Variant-based"}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </dl>
        </Card>

        {/* Descriptions */}
        {(product.short_description_en || product.short_description_ar ||
          product.long_description_en || product.long_description_ar) && (
          <Card>
            <h4 className="text-lg font-semibold text-third mb-4">Descriptions</h4>
            <div className="space-y-4">
              {product.short_description_en && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Short Description (EN)</p>
                  <p className="text-sm text-gray-700">{product.short_description_en}</p>
                </div>
              )}
              {product.short_description_ar && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Short Description (AR)</p>
                  <p className="text-sm text-gray-700" dir="rtl">{product.short_description_ar}</p>
                </div>
              )}
              {product.long_description_en && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Long Description (EN)</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.long_description_en}</p>
                </div>
              )}
              {product.long_description_ar && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Long Description (AR)</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap" dir="rtl">{product.long_description_ar}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Ratings & Reviews */}
        <Card>
          <h4 className="text-lg font-semibold text-third mb-4 flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings & Reviews
          </h4>
          <dl className="space-y-0">
            <InfoRow
              label="Average Rating"
              value={
                <div className="flex items-center gap-2">
                  {product.average_rating ? (
                    <>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.average_rating || 0)
                                ? "text-fourth fill-fourth"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span>{formatRating(product.average_rating)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">No ratings yet</span>
                  )}
                </div>
              }
              icon={<Star className="h-4 w-4" />}
            />
            <InfoRow
              label="Total Ratings"
              value={product.total_ratings || <span className="text-gray-400">0</span>}
            />
          </dl>
        </Card>

        {/* Timestamps */}
        <Card>
          <h4 className="text-lg font-semibold text-third mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timestamps
          </h4>
          <dl className="space-y-0">
            <InfoRow
              label="Created At"
              value={formatDate(product.created_at)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoRow
              label="Updated At"
              value={formatDate(product.updated_at)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </dl>
        </Card>
      </div>
    </Modal>
  );
};

/**
 * Single Page Product Form Component
 * All sections in one scrollable page
 */

"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  ProductFormData,
  Attribute,
  SinglePricing,
  VariantPricing,
  WeightDimensions,
  VariantWeightDimensions,
  MediaItem,
  VariantMedia,
  VariantCombination,
} from "../../services/products/types/product-form.types";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { AttributesSection } from "./sections/AttributesSection";
import { PricingSection } from "./sections/PricingSection";
import { WeightDimensionsSection } from "./sections/WeightDimensionsSection";
import { MediaSection } from "./sections/MediaSection";
import { StockSection } from "./sections/StockSection";
import { Card } from "../ui";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEditMode?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onSaveDraft?: (data: Partial<ProductFormData>) => Promise<void>;
  categories?: Array<{ id: string; name: string }>;
  vendors?: Array<{ id: string; name: string }>;
  attributes?: Array<{ id: string; name: string; displayName: string; values: Array<{ id: string; value: string; displayValue: string }> }>;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  isEditMode = false,
  onSubmit,
  onSaveDraft,
  categories = [],
  vendors = [],
  attributes = [],
}) => {
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    nameEn: "",
    nameAr: "",
    categoryId: "",
    vendorId: "",
    shortDescriptionEn: "",
    shortDescriptionAr: "",
    longDescriptionEn: "",
    longDescriptionAr: "",
    pricingType: "single",
    isActive: true,
    attributes: [],
    singlePricing: undefined,
    variantPricing: [],
    isWeightVariantBased: false,
    singleWeightDimensions: undefined,
    variantWeightDimensions: [],
    isMediaVariantBased: false,
    singleMedia: [],
    variantMedia: [],
    variants: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Check if any attribute controls pricing, media, or weight
  const hasAttributeControllingPricing =
    formData.attributes?.some((attr) => attr.controlsPricing) || false;
  const hasAttributeControllingMedia =
    formData.attributes?.some((attr) => attr.controlsMedia) || false;
  const hasAttributeControllingWeight =
    formData.attributes?.some((attr) => attr.controlsWeightDimensions) || false;

  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      setIsSubmitting(true);
      try {
        await onSaveDraft(formData);
      } catch (error) {
        console.error("Failed to save draft:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    const newErrors: { [key: string]: string } = {};

    if (!formData.nameEn) newErrors.nameEn = "English name is required";
    if (!formData.nameAr) newErrors.nameAr = "Arabic name is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData as ProductFormData);
    } catch (error) {
      console.error("Failed to submit form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSalePercentage = (price: number, salePrice?: number) => {
    if (!salePrice || salePrice >= price) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  return (
    <div className="mx-auto px-4 py-8 flex flex-col gap-5">
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? "Edit Product" : "Create New Product"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode
            ? "Update product information and variants"
            : "Fill in the details to create a new product"}
        </p>
      </div>

      {/* Basic Information */}
      <BasicInformationSection
        formData={{
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          categoryId: formData.categoryId,
          vendorId: formData.vendorId,
          shortDescriptionEn: formData.shortDescriptionEn,
          shortDescriptionAr: formData.shortDescriptionAr,
          longDescriptionEn: formData.longDescriptionEn,
          longDescriptionAr: formData.longDescriptionAr,
          pricingType: formData.pricingType,
          isActive: formData.isActive,
        }}
        errors={errors}
        categories={categories}
        vendors={vendors}
        onChange={handleFieldChange}
      />

      {/* Attributes Configuration */}
      {formData.pricingType === "variant" && (
        <AttributesSection
          attributes={formData.attributes || []}
          availableAttributes={attributes}
          onChange={(attributes: Attribute[]) =>
            handleFieldChange("attributes", attributes)
          }
        />
      )}

      {/* Pricing Configuration */}
      <PricingSection
        pricingType={formData.pricingType || "single"}
        attributes={formData.attributes || []}
        singlePricing={formData.singlePricing}
        variantPricing={formData.variantPricing || []}
        onChangeSingle={(pricing: SinglePricing) =>
          handleFieldChange("singlePricing", pricing)
        }
        onChangeVariant={(pricing: VariantPricing[]) =>
          handleFieldChange("variantPricing", pricing)
        }
        calculateSalePercentage={calculateSalePercentage}
      />

      {/* Weight & Dimensions */}
      <WeightDimensionsSection
        attributes={formData.attributes || []}
        isWeightVariantBased={formData.isWeightVariantBased || false}
        singleWeightDimensions={formData.singleWeightDimensions}
        variantWeightDimensions={formData.variantWeightDimensions || []}
        onToggleVariantBased={(value: boolean) =>
          handleFieldChange("isWeightVariantBased", value)
        }
        onChangeSingle={(data: WeightDimensions) =>
          handleFieldChange("singleWeightDimensions", data)
        }
        onChangeVariant={(data: VariantWeightDimensions[]) =>
          handleFieldChange("variantWeightDimensions", data)
        }
        hasAttributeControllingWeight={hasAttributeControllingWeight}
      />

      {/* Media Management */}
      <MediaSection
        attributes={formData.attributes || []}
        isMediaVariantBased={formData.isMediaVariantBased || false}
        singleMedia={formData.singleMedia || []}
        variantMedia={formData.variantMedia || []}
        onToggleVariantBased={(value: boolean) =>
          handleFieldChange("isMediaVariantBased", value)
        }
        onChangeSingle={(media: MediaItem[]) =>
          handleFieldChange("singleMedia", media)
        }
        onChangeVariant={(media: VariantMedia[]) =>
          handleFieldChange("variantMedia", media)
        }
        hasAttributeControllingMedia={hasAttributeControllingMedia}
      />

      {/* Stock Management */}
      <StockSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        pricingType={formData.pricingType || "single"}
        onChange={(variants: VariantCombination[]) =>
          handleFieldChange("variants", variants)
        }
      />

      {/* Submit Buttons */}
      <Card>
        <div className="flex items-center justify-end gap-5">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isEditMode
                ? "Update Product"
                : "Create Product"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

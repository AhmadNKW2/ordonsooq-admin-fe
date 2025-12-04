/**
 * Single Page Product Form Component
 * All sections in one scrollable page
 * Uses Zod for validation
 */

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { PageHeader } from "../common/PageHeader";
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
import { useZodValidation } from "../../hooks/use-zod-validation";
import { createProductSchema, type ProductFormConfig } from "../../lib/validations/product.schema";
import { Package } from "lucide-react";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEditMode?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onSaveDraft?: (data: Partial<ProductFormData>) => Promise<void>;
  categories?: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
  vendors?: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
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
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    nameEn: "",
    nameAr: "",
    categoryIds: [],
    vendorId: "",
    shortDescriptionEn: "",
    shortDescriptionAr: "",
    longDescriptionEn: "",
    longDescriptionAr: "",
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

  // Update formData when initialData changes (for edit mode)
  // Use JSON.stringify to create a stable dependency
  const initialDataJson = JSON.stringify(initialData);
  React.useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      console.log('=== DEBUG: Updating formData from initialData ===');
      console.log('initialData:', initialData);
      console.log('initialData.isMediaVariantBased:', initialData.isMediaVariantBased);
      console.log('initialData.variantMedia:', initialData.variantMedia);
      console.log('initialData.singleMedia:', initialData.singleMedia);
      setFormData({
        nameEn: "",
        nameAr: "",
        categoryIds: [],
        vendorId: "",
        shortDescriptionEn: "",
        shortDescriptionAr: "",
        longDescriptionEn: "",
        longDescriptionAr: "",
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialDataJson]);

  // Build dynamic Zod schema based on form state
  const validationConfig = useMemo<ProductFormConfig>(() => {
    const pricingAttributes = formData.attributes?.filter(a => a.controlsPricing) || [];
    const hasPricingAttributes = pricingAttributes.length > 0;
    
    // Check which variant pricing items have sale enabled
    const variantPricingItems: { isSale: boolean }[] = formData.variantPricing?.map(vp => ({ isSale: vp.isSale !== false })) || [];

    return {
      hasPricingAttributes,
      singlePricingIsSale: formData.singlePricing?.isSale !== false,
      variantPricingItems,
      isWeightVariantBased: formData.isWeightVariantBased || false,
      isMediaVariantBased: formData.isMediaVariantBased || false,
    };
  }, [
    formData.attributes,
    formData.singlePricing?.isSale,
    formData.variantPricing,
    formData.isWeightVariantBased,
    formData.isMediaVariantBased,
  ]);

  const zodSchema = useMemo(() => createProductSchema(validationConfig), [validationConfig]);
  
  const { errors, validateForm, validateField, clearFieldError, isSubmitted } = useZodValidation<ProductFormData>({
    schema: zodSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('=== DEBUG: handleSubmit called ===');
    console.log('formData:', formData);
    console.log('formData.isMediaVariantBased:', formData.isMediaVariantBased);
    console.log('formData.variantMedia:', formData.variantMedia);
    console.log('formData.singleMedia:', formData.singleMedia);
    console.log('zodSchema:', zodSchema);

    // Cast to ProductFormData for validation (with defaults)
    const dataToValidate: ProductFormData = {
      nameEn: formData.nameEn || '',
      nameAr: formData.nameAr || '',
      categoryIds: formData.categoryIds || [],
      vendorId: formData.vendorId || '',
      shortDescriptionEn: formData.shortDescriptionEn || '',
      shortDescriptionAr: formData.shortDescriptionAr || '',
      longDescriptionEn: formData.longDescriptionEn || '',
      longDescriptionAr: formData.longDescriptionAr || '',
      isActive: formData.isActive ?? true,
      isWeightVariantBased: formData.isWeightVariantBased ?? false,
      isMediaVariantBased: formData.isMediaVariantBased ?? false,
      attributes: formData.attributes,
      singlePricing: formData.singlePricing,
      variantPricing: formData.variantPricing,
      singleWeightDimensions: formData.singleWeightDimensions,
      variantWeightDimensions: formData.variantWeightDimensions,
      singleMedia: formData.singleMedia,
      variantMedia: formData.variantMedia,
      variants: formData.variants,
    };

    const isValid = validateForm(dataToValidate);
    console.log('isValid:', isValid);
    console.log('errors after validation:', errors);

    if (!isValid) {
      console.log('=== Validation failed, not submitting ===');
      return;
    }

    console.log('=== Validation passed, submitting ===');

    setIsSubmitting(true);
    try {
      await onSubmit(formData as ProductFormData);
    } catch (error) {
      console.error("Failed to submit form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    // DEBUG: Log field changes for media
    if (field === 'singleMedia' || field === 'variantMedia' || field === 'isMediaVariantBased') {
      console.log('=== DEBUG: handleFieldChange for media ===');
      console.log('field:', field);
      console.log('value:', value);
      if (field === 'singleMedia' && Array.isArray(value)) {
        value.forEach((item: any, idx: number) => {
          console.log(`value[${idx}]:`, item);
          console.log(`value[${idx}].file:`, item.file);
          console.log(`value[${idx}].file instanceof File:`, item.file instanceof File);
        });
      }
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // DEBUG: Log updated form data for media fields
      if (field === 'singleMedia' || field === 'variantMedia' || field === 'isMediaVariantBased') {
        console.log('=== DEBUG: Updated formData ===');
        console.log('newData.singleMedia:', newData.singleMedia);
        console.log('newData.singleMedia?.length:', newData.singleMedia?.length);
      }

      return newData;
    });
    
    // Clear field error when value changes (after submission)
    if (isSubmitted) {
      clearFieldError(field);
    }
  };

  // Check if any attribute controls pricing, media, or weight
  const hasAttributeControllingPricing =
    formData.attributes?.some((attr) => attr.controlsPricing) || false;
  const hasAttributeControllingMedia =
    formData.attributes?.some((attr) => attr.controlsMedia) || false;
  const hasAttributeControllingWeight =
    formData.attributes?.some((attr) => attr.controlsWeightDimensions) || false;

  const calculateSalePercentage = (price: number, salePrice?: number) => {
    if (!salePrice || salePrice >= price) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  return (
    <div className="mx-auto p-5 flex flex-col gap-5">
      <PageHeader
        icon={<Package />}
        title={isEditMode ? "Edit Product" : "Create New Product"}
        description={isEditMode ? "Update product information and variants" : "Fill in the details to create a new product"}
        cancelAction={{
          label: "Cancel",
          onClick: () => router.push('/products'),
          disabled: isSubmitting,
        }}
        action={{
          label: isSubmitting ? "Submitting..." : (isEditMode ? "Update Product" : "Create Product"),
          onClick: handleSubmit,
          disabled: isSubmitting,
        }}
      />
      {/* Basic Information */}
      <BasicInformationSection
        formData={{
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          categoryIds: formData.categoryIds,
          vendorId: formData.vendorId,
          shortDescriptionEn: formData.shortDescriptionEn,
          shortDescriptionAr: formData.shortDescriptionAr,
          longDescriptionEn: formData.longDescriptionEn,
          longDescriptionAr: formData.longDescriptionAr,
          isActive: formData.isActive,
        }}
        errors={errors}
        categories={categories}
        vendors={vendors}
        onChange={handleFieldChange}
      />

      {/* Attributes Configuration - Always visible */}
      <AttributesSection
        attributes={formData.attributes || []}
        availableAttributes={attributes}
        onChange={(attributes: Attribute[], resetType?: 'pricing' | 'weight' | 'media' | 'stock' | 'all') => {
          const hasWeight = attributes.some(a => a.controlsWeightDimensions);
          const hasMedia = attributes.some(a => a.controlsMedia);
          const hasAttributes = attributes.length > 0;

          setFormData(prev => {
            const updates: Partial<ProductFormData> = {
              ...prev,
              attributes,
              isWeightVariantBased: hasAttributes ? hasWeight : false,
              isMediaVariantBased: hasAttributes ? hasMedia : false,
            };

            // If switching to single (no attributes), reset all variant data
            if (!hasAttributes) {
              updates.variantPricing = [];
              updates.variantWeightDimensions = [];
              updates.variantMedia = [];
              updates.variants = [];
              updates.singlePricing = prev.singlePricing;
              updates.singleWeightDimensions = prev.singleWeightDimensions;
              updates.singleMedia = prev.singleMedia || [];
            }

            // Reset ALL variant data when an attribute is removed
            // because existing combinations become invalid
            if (resetType === 'all') {
              updates.variantPricing = [];
              updates.singleWeightDimensions = undefined;
              updates.variantWeightDimensions = [];
              updates.singleMedia = [];
              updates.variantMedia = [];
              updates.variants = [];
            } else if (resetType === 'pricing') {
              // Reset data when control changes (both toggling ON and OFF)
              // This ensures variant combinations are recalculated with fresh data
              updates.variantPricing = [];
            } else if (resetType === 'weight') {
              updates.singleWeightDimensions = undefined;
              updates.variantWeightDimensions = [];
            } else if (resetType === 'media') {
              updates.singleMedia = [];
              updates.variantMedia = [];
            } else if (resetType === 'stock') {
              // Reset stock/variants when attributes or their values change
              updates.variants = [];
            }

            return updates as ProductFormData;
          });
          // Clear attribute errors when changed
          if (isSubmitted) {
            clearFieldError("attributes");
          }
        }}
        errors={errors}
      />

      {/* Pricing Configuration */}
      <PricingSection
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
        errors={errors}
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
        errors={errors}
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
        errors={errors}
      />

      {/* Stock Management */}
      <StockSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        onChange={(variants: VariantCombination[]) =>
          handleFieldChange("variants", variants)
        }
        errors={errors}
      />
    </div>
  );
};

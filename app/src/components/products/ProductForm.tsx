/**
 * Single Page Product Form Component
 * All sections in one scrollable page
 */

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { useFormValidation, ValidationSchema } from "../../hooks/use-form-validation";

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
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    nameEn: "",
    nameAr: "",
    categoryId: "",
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
        categoryId: "",
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

  const validationSchema = useMemo<ValidationSchema>(() => {
    const schema: ValidationSchema = {
      nameEn: ['required', 'isEn'],
      nameAr: ['required', 'isAr'],
      shortDescriptionEn: ['required', 'isEn'],
      shortDescriptionAr: ['required', 'isAr'],
      longDescriptionEn: ['required', 'isEn'],
      longDescriptionAr: ['required', 'isAr'],
      categoryId: ['required'],
      vendorId: ['required'],
    };

    const pricingAttributes = formData.attributes?.filter(a => a.controlsPricing) || [];
    const isVariantPricing = pricingAttributes.length > 0;

    // Conditional Validation: Pricing
    if (!isVariantPricing) {
      schema['singlePricing.cost'] = ['required', 'isNum'];
      schema['singlePricing.price'] = ['required', 'isNum'];

      // isSale defaults to true, so require salePrice unless explicitly set to false
      if (formData.singlePricing?.isSale !== false) {
        schema['singlePricing.salePrice'] = ['required', 'isNum'];
      }
    } else {
      schema['attributes'] = ['required'];
      schema['variants'] = ['required'];
      schema['variantPricing.$.cost'] = ['required', 'isNum'];
      schema['variantPricing.$.price'] = ['required', 'isNum'];

      formData.variantPricing?.forEach((vp, index) => {
        // isSale defaults to true, so require salePrice unless explicitly set to false
        if (vp.isSale !== false) {
          schema[`variantPricing.${index}.salePrice`] = ['required', 'isNum'];
        }
      });

      schema['variants.$.stock'] = ['required', 'isNum'];
    }

    // Conditional Validation: Weight & Dimensions
    if (!formData.isWeightVariantBased) {
      schema['singleWeightDimensions.weight'] = ['required', 'isNum'];
      schema['singleWeightDimensions.length'] = ['required', 'isNum'];
      schema['singleWeightDimensions.width'] = ['required', 'isNum'];
      schema['singleWeightDimensions.height'] = ['required', 'isNum'];
    } else {
      schema['variantWeightDimensions.$.weight'] = ['required', 'isNum'];
      schema['variantWeightDimensions.$.length'] = ['required', 'isNum'];
      schema['variantWeightDimensions.$.width'] = ['required', 'isNum'];
      schema['variantWeightDimensions.$.height'] = ['required', 'isNum'];
    }

    // Conditional Validation: Media
    if (!formData.isMediaVariantBased) {
      schema['singleMedia'] = ['required'];
    } else {
      schema['variantMedia.$.media'] = ['required'];
    }

    return schema;
  }, [
    formData.attributes,
    formData.singlePricing?.isSale,
    formData.variantPricing,
    formData.isWeightVariantBased,
    formData.isMediaVariantBased
  ]);

  const { errors, handleValidationChange, validateForm, isSubmitted } = useFormValidation(validationSchema);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('=== DEBUG: handleSubmit called ===');
    console.log('formData:', formData);
    console.log('formData.isMediaVariantBased:', formData.isMediaVariantBased);
    console.log('formData.variantMedia:', formData.variantMedia);
    console.log('formData.singleMedia:', formData.singleMedia);
    console.log('validationSchema:', validationSchema);

    const isValid = validateForm(formData);
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
    handleValidationChange(field, value);
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
    <div className="mx-auto px-5 py-8 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold ">
            {isEditMode ? "Edit Product" : "Create New Product"}
          </h1>
          <p className=" mt-2">
            {isEditMode
              ? "Update product information and variants"
              : "Fill in the details to create a new product"}
          </p>
        </div>

        <div className="flex gap-5">
          {/* Cancel Button */}
          <Button
            onClick={() => router.push('/products')}
            disabled={isSubmitting}
            variant="solid"
            color="var(--color-primary2)"
          >
            Cancel
          </Button>

          {/* Submit Button */}
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
          handleValidationChange("attributes", attributes);
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

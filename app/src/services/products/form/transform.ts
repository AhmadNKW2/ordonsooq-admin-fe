/**
 * Helper functions to transform product form data to backend DTOs
 */

import { ProductFormData, MediaItem } from "../types/product-form.types";
import { CreateProductDto } from "../api/product.service";

/**
 * Media upload data structure
 */
export interface MediaUploadData {
  singleMedia?: MediaItem[];
  variantMedia?: {
    attributeValues: Record<string, string>;
    media: MediaItem[];
  }[];
}

/**
 * Transform frontend ProductFormData to CreateProductDto (without media)
 * and extract media data for separate upload
 */
export function transformFormDataToDto(
  data: ProductFormData
): { dto: CreateProductDto; mediaData: MediaUploadData } {
  const dto: CreateProductDto = {
    name_en: data.nameEn,
    name_ar: data.nameAr,
    short_description_en: data.shortDescriptionEn || '',
    short_description_ar: data.shortDescriptionAr || '',
    long_description_en: data.longDescriptionEn || '',
    long_description_ar: data.longDescriptionAr || '',
    pricing_type: data.pricingType,
    category_id: parseInt(data.categoryId),
    is_active: data.isActive,
  };

  // Optional fields
  if (data.vendorId) dto.vendor_id = parseInt(data.vendorId);

  // Attributes
  if (data.pricingType === "variant" && data.attributes && data.attributes.length > 0) {
    dto.attributes = data.attributes.map((attr) => ({
      attribute_id: parseInt(attr.id),
      controls_pricing: attr.controlsPricing,
      controls_media: attr.controlsMedia,
      controls_weight: attr.controlsWeightDimensions,
    }));
  }

  // Single Pricing
  if (data.pricingType === "single" && data.singlePricing) {
    dto.single_pricing = {
      cost: data.singlePricing.cost,
      price: data.singlePricing.price,
      sale_price: data.singlePricing.isSale ? data.singlePricing.salePrice : undefined,
    };
  }

  // Variant Pricing
  if (data.pricingType === "variant" && data.variantPricing && data.variantPricing.length > 0) {
    dto.variant_pricing = data.variantPricing.map((pricing) => ({
      combination: convertAttributeValuesToNumberMap(pricing.attributeValues),
      cost: pricing.cost,
      price: pricing.price,
      sale_price: pricing.isSale ? pricing.salePrice : undefined,
    }));
  }

  // Single Weight
  if (!data.isWeightVariantBased && data.singleWeightDimensions) {
    const weight = data.singleWeightDimensions;
    if (weight.weight) {
      dto.product_weight = {
        weight: weight.weight,
        length: weight.length,
        width: weight.width,
        height: weight.height,
      };
    }
  }

  // Variant Weights
  if (data.isWeightVariantBased && data.variantWeightDimensions && data.variantWeightDimensions.length > 0) {
    dto.variant_weights = data.variantWeightDimensions
      .filter((vw) => vw.weight)
      .map((vw) => ({
        combination: convertAttributeValuesToNumberMap(vw.attributeValues),
        weight: vw.weight!,
        length: vw.length,
        width: vw.width,
        height: vw.height,
      }));
  }

  // Stock
  if (data.pricingType === "variant" && data.variants && data.variants.length > 0) {
    dto.stock = data.variants.map((variant) => ({
      combination: convertAttributeValuesToNumberMap(variant.attributeValues),
      stock_quantity: variant.stock,
    }));
  }

  // Extract media data for separate upload
  const mediaData: MediaUploadData = {};
  
  if (!data.isMediaVariantBased && data.singleMedia && data.singleMedia.length > 0) {
    mediaData.singleMedia = data.singleMedia;
  }

  if (data.isMediaVariantBased && data.variantMedia && data.variantMedia.length > 0) {
    mediaData.variantMedia = data.variantMedia;
  }

  return { dto, mediaData };
}

/**
 * Convert attribute values from string map to number map
 * Frontend uses string IDs, backend expects number IDs
 */
function convertAttributeValuesToNumberMap(
  attributeValues: { [attrId: string]: string }
): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const [attrId, valueId] of Object.entries(attributeValues)) {
    result[attrId] = parseInt(valueId);
  }
  
  return result;
}

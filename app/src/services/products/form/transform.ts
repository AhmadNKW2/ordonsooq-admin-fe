/**
 * Helper functions to transform product form data to backend DTOs
 */

import { ProductFormData, MediaItem } from "../types/product-form.types";
import { CreateProductDto, PriceGroupInput, WeightGroupInput, VariantInput } from "../types/product.types";

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

  // Variant product fields
  if (data.pricingType === "variant" && data.attributes && data.attributes.length > 0) {
    // Attributes
    dto.attributes = data.attributes.map((attr) => ({
      attribute_id: parseInt(attr.id),
      controls_pricing: attr.controlsPricing,
      controls_media: attr.controlsMedia,
      controls_weight: attr.controlsWeightDimensions,
    }));

    // Price groups (grouped by pricing-controlling attributes)
    dto.price_groups = buildPriceGroups(data);

    // Weight groups (grouped by weight-controlling attributes)
    if (data.isWeightVariantBased && data.variantWeightDimensions) {
      dto.weight_groups = buildWeightGroups(data);
    }

    // Variants (all combinations with stock)
    dto.variants = buildVariantsArray(data);
  }

  // Single Pricing (for single pricing type)
  if (data.pricingType === "single" && data.singlePricing) {
    dto.single_pricing = {
      cost: data.singlePricing.cost,
      price: data.singlePricing.price,
      sale_price: data.singlePricing.isSale ? data.singlePricing.salePrice : undefined,
    };
  }

  // Single Weight (for single pricing type or non-variant weight)
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

  // Single Stock (for single pricing type)
  if (data.pricingType === "single" && data.variants && data.variants.length > 0) {
    const singleVariant = data.variants.find(v => v.id === 'single');
    if (singleVariant) {
      dto.stock_quantity = singleVariant.stock;
    }
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
 * Build price_groups array from form data
 * Groups by pricing-controlling attributes only
 */
function buildPriceGroups(data: ProductFormData): PriceGroupInput[] {
  if (!data.variantPricing || data.variantPricing.length === 0) {
    return [];
  }

  // Get pricing-controlling attribute IDs
  const pricingControllingAttrIds = (data.attributes || [])
    .filter(attr => attr.controlsPricing)
    .map(attr => attr.id);

  // Build unique price groups based on pricing-controlling attributes
  const priceGroupMap = new Map<string, PriceGroupInput>();

  for (const pricing of data.variantPricing) {
    // Build combination object with only pricing-controlling attributes
    // Format: { "attr_id": value_id }
    const combination: Record<string, number> = {};
    
    for (const attrId of pricingControllingAttrIds) {
      const valueId = pricing.attributeValues[attrId];
      if (valueId && valueId !== '') {
        combination[attrId] = parseInt(valueId, 10);
      }
    }

    // Create unique key for deduplication
    const key = Object.entries(combination)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    // Only add if not already exists
    if (!priceGroupMap.has(key) && Object.keys(combination).length > 0) {
      priceGroupMap.set(key, {
        combination,
        cost: pricing.cost,
        price: pricing.price,
        sale_price: pricing.isSale ? pricing.salePrice : null,
      });
    }
  }

  return Array.from(priceGroupMap.values());
}

/**
 * Build weight_groups array from form data
 * Groups by weight-controlling attributes only
 */
function buildWeightGroups(data: ProductFormData): WeightGroupInput[] {
  if (!data.variantWeightDimensions || data.variantWeightDimensions.length === 0) {
    return [];
  }

  // Get weight-controlling attribute IDs
  const weightControllingAttrIds = (data.attributes || [])
    .filter(attr => attr.controlsWeightDimensions)
    .map(attr => attr.id);

  const weightGroups: WeightGroupInput[] = [];

  for (const weight of data.variantWeightDimensions) {
    // Build combination object with only weight-controlling attributes
    // Format: { "attr_id": value_id }
    const combination: Record<string, number> = {};
    
    for (const attrId of weightControllingAttrIds) {
      const valueId = weight.attributeValues[attrId];
      if (valueId && valueId !== '') {
        combination[attrId] = parseInt(valueId, 10);
      }
    }

    if (Object.keys(combination).length > 0 && weight.weight) {
      weightGroups.push({
        combination,
        weight: weight.weight,
        length: weight.length,
        width: weight.width,
        height: weight.height,
      });
    }
  }

  return weightGroups;
}

/**
 * Build variants array from form data
 * Each variant contains attribute_value_ids and stock_quantity
 */
function buildVariantsArray(data: ProductFormData): VariantInput[] {
  const variants: VariantInput[] = [];

  // Use data.variants which contains all combinations with stock
  if (!data.variants || data.variants.length === 0) {
    return variants;
  }

  for (const variant of data.variants) {
    // Get all attribute value IDs from the combination
    const attributeValueIds = getAttributeValueIds(variant.attributeValues);
    
    if (attributeValueIds.length === 0) {
      console.warn('Skipping variant: no valid attribute value IDs');
      continue;
    }

    variants.push({
      attribute_value_ids: attributeValueIds,
      stock_quantity: variant.stock || 0,
    });
  }

  return variants;
}

/**
 * Get attribute value IDs from attributeValues map
 */
function getAttributeValueIds(attributeValues: { [attrId: string]: string }): number[] {
  const ids: number[] = [];
  
  for (const valueId of Object.values(attributeValues)) {
    if (valueId === undefined || valueId === null || valueId === '') {
      continue;
    }
    
    const numericId = parseInt(valueId, 10);
    if (!isNaN(numericId)) {
      ids.push(numericId);
    }
  }
  
  return ids;
}

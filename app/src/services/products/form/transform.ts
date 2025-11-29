/**
 * Helper functions to transform product form data to backend DTOs
 */

import { ProductFormData, MediaItem } from "../types/product-form.types";
import { CreateProductDto, VariantInput, MediaInputDto } from "../types/product.types";

/**
 * Media upload data structure - contains files that need to be uploaded
 */
export interface MediaUploadData {
  singleMedia?: MediaItem[];
  variantMedia?: {
    attributeValues: Record<string, string>;
    media: MediaItem[];
  }[];
}

/**
 * Uploaded media reference - after upload, contains media IDs
 */
export interface UploadedMediaReference {
  mediaId: number;
  isPrimary: boolean;
  sortOrder: number;
  combination?: Record<string, number>;
}

/**
 * Transform frontend ProductFormData to CreateProductDto (without media)
 * and extract media files for separate upload
 * 
 * The flow is:
 * 1. Call this function to get DTO and media files
 * 2. Upload media files via mediaService.uploadMedia()
 * 3. Call addMediaToDto() to add media IDs to the DTO
 * 4. Send the complete DTO to create/update product
 */
export function transformFormDataToDto(
  data: ProductFormData
): { dto: CreateProductDto; mediaFiles: MediaUploadData } {
  const dto: CreateProductDto = {
    name_en: data.nameEn,
    name_ar: data.nameAr,
    short_description_en: data.shortDescriptionEn || '',
    short_description_ar: data.shortDescriptionAr || '',
    long_description_en: data.longDescriptionEn || '',
    long_description_ar: data.longDescriptionAr || '',
    category_id: parseInt(data.categoryId),
    is_active: data.isActive,
  };

  // Optional fields
  if (data.vendorId) dto.vendor_id = parseInt(data.vendorId);

  // Attributes
  if (data.attributes && data.attributes.length > 0) {
    dto.attributes = data.attributes.map((attr) => ({
      attribute_id: parseInt(attr.id),
      controls_pricing: attr.controlsPricing,
      controls_media: attr.controlsMedia,
      controls_weight: attr.controlsWeightDimensions,
    }));

    // Variants (all combinations with stock)
    dto.variants = buildVariantsArray(data);
  }

  // ========== PRICING ==========
  if (!data.attributes || data.attributes.length === 0) {
    // Single pricing - no combination
    if (data.singlePricing) {
      dto.prices = [{
        cost: data.singlePricing.cost,
        price: data.singlePricing.price,
        sale_price: data.singlePricing.isSale ? data.singlePricing.salePrice : undefined,
      }];
    }
  } else {
    // Variant pricing - with combinations
    dto.prices = buildPrices(data);
  }

  // ========== WEIGHT & DIMENSIONS ==========
  if (!data.isWeightVariantBased && data.singleWeightDimensions) {
    const weight = data.singleWeightDimensions;
    if (weight.weight) {
      dto.weights = [{
        weight: weight.weight,
        length: weight.length,
        width: weight.width,
        height: weight.height,
      }];
    }
  } else if (data.isWeightVariantBased && data.variantWeightDimensions) {
    dto.weights = buildWeights(data);
  }

  // ========== STOCK ==========
  if (!data.attributes || data.attributes.length === 0) {
    // Single stock - no combination
    if (data.variants && data.variants.length > 0) {
      const singleVariant = data.variants.find(v => v.id === 'single');
      if (singleVariant) {
        dto.stocks = [{
          quantity: singleVariant.stock,
        }];
      }
    }
  } else if (data.variants && data.variants.length > 0) {
    // Variant stocks - with combinations
    dto.stocks = buildStocks(data);
  }

  // Extract media data for separate upload
  const mediaFiles: MediaUploadData = {};
  
  if (!data.isMediaVariantBased && data.singleMedia && data.singleMedia.length > 0) {
    mediaFiles.singleMedia = data.singleMedia;
  }

  if (data.isMediaVariantBased && data.variantMedia && data.variantMedia.length > 0) {
    mediaFiles.variantMedia = data.variantMedia;
  }

  return { dto, mediaFiles };
}

/**
 * Build media array for the DTO from uploaded media references
 * Call this after uploading media files to get the media_id references
 */
export function buildMediaArray(
  uploadedMedia: UploadedMediaReference[]
): MediaInputDto[] {
  return uploadedMedia.map(media => ({
    media_id: media.mediaId,
    is_primary: media.isPrimary,
    sort_order: media.sortOrder,
    combination: media.combination,
  }));
}

interface PriceItem {
  combination?: Record<string, number>;
  cost: number;
  price: number;
  sale_price?: number;
}

interface WeightItem {
  combination?: Record<string, number>;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

interface StockItem {
  combination?: Record<string, number>;
  quantity: number;
}

/**
 * Build prices array from form data
 * Groups by pricing-controlling attributes only
 */
function buildPrices(data: ProductFormData): PriceItem[] {
  if (!data.variantPricing || data.variantPricing.length === 0) {
    return [];
  }

  // Get pricing-controlling attribute IDs
  const pricingControllingAttrIds = (data.attributes || [])
    .filter(attr => attr.controlsPricing)
    .map(attr => attr.id);

  // Build unique prices based on pricing-controlling attributes
  const priceMap = new Map<string, PriceItem>();

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
    if (!priceMap.has(key) && Object.keys(combination).length > 0) {
      priceMap.set(key, {
        combination,
        cost: pricing.cost,
        price: pricing.price,
        sale_price: pricing.isSale ? pricing.salePrice : undefined,
      });
    }
  }

  return Array.from(priceMap.values());
}

/**
 * Build weights array from form data
 * Groups by weight-controlling attributes only
 */
function buildWeights(data: ProductFormData): WeightItem[] {
  if (!data.variantWeightDimensions || data.variantWeightDimensions.length === 0) {
    return [];
  }

  // Get weight-controlling attribute IDs
  const weightControllingAttrIds = (data.attributes || [])
    .filter(attr => attr.controlsWeightDimensions)
    .map(attr => attr.id);

  const weights: WeightItem[] = [];

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
      weights.push({
        combination,
        weight: weight.weight,
        length: weight.length,
        width: weight.width,
        height: weight.height,
      });
    }
  }

  return weights;
}

/**
 * Build stocks array from form data
 * Each stock contains combination and quantity
 */
function buildStocks(data: ProductFormData): StockItem[] {
  if (!data.variants || data.variants.length === 0) {
    return [];
  }

  const stocks: StockItem[] = [];

  for (const variant of data.variants) {
    // Build combination from all attribute values
    const combination: Record<string, number> = {};
    
    for (const [attrId, valueId] of Object.entries(variant.attributeValues)) {
      if (valueId && valueId !== '') {
        combination[attrId] = parseInt(valueId, 10);
      }
    }

    if (Object.keys(combination).length > 0) {
      stocks.push({
        combination,
        quantity: variant.stock || 0,
      });
    }
  }

  return stocks;
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

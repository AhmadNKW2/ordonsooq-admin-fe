/**
 * Helper functions to transform product form data to backend DTOs
 */

import { ProductFormData, MediaItem } from "../types/product-form.types";
import {
  CreateProductDto,
  MediaInputDto,
  ProductSpecificationInputDto,
} from "../types/product.types";

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
  isGroupPrimary?: boolean;
  sortOrder: number;
  combination?: Record<string, number>;
}

export function buildProductSpecificationsPayload(
  specifications: ProductFormData["specifications"]
): ProductSpecificationInputDto[] {
  if (!specifications || specifications.length === 0) {
    return [];
  }

  return specifications.flatMap((specification) => {
    const specificationId = parseInt(specification.id, 10);
    if (Number.isNaN(specificationId)) {
      return [];
    }

    const specificationValueIds = Array.from(
      new Set(
        specification.values
          .map((value) => parseInt(value.id, 10))
          .filter((valueId) => !Number.isNaN(valueId))
      )
    );

    if (specificationValueIds.length === 0) {
      return [];
    }

    return [
      {
        specification_id: specificationId,
        specification_value_ids: specificationValueIds,
      },
    ];
  });
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
  const specificationsPayload = buildProductSpecificationsPayload(data.specifications);
  const linkedProductIds = Array.from(
    new Set(
      (data.linked_product_ids || [])
        .map((id) => parseInt(id, 10))
        .filter((id) => !Number.isNaN(id))
    )
  );

  const dto: CreateProductDto = {
    name_en: data.nameEn,
    name_ar: data.nameAr,
    status: data.status,
    short_description_en: data.shortDescriptionEn || '',
    short_description_ar: data.shortDescriptionAr || '',
    long_description_en: data.longDescriptionEn || '',
    long_description_ar: data.longDescriptionAr || '',
    category_ids: (data.categoryIds || []).map(id => parseInt(id)), // Changed to category_ids array
    reference_link: data.referenceLink?.trim() || null,
    linked_product_ids: linkedProductIds,
    visible: data.visible,
  };

  // Optional fields
  if (data.vendorId) dto.vendor_id = parseInt(data.vendorId);
  if (data.brandId) dto.brand_id = parseInt(data.brandId);
  if (specificationsPayload.length > 0) dto.specifications = specificationsPayload;

  // Attributes
  if (data.attributes && data.attributes.length > 0) {
    dto.attributes = data.attributes.map((attr) => ({
      attribute_id: parseInt(attr.id),
      controls_pricing: attr.controlsPricing,
      controls_media: attr.controlsMedia,
      controls_weight: attr.controlsWeightDimensions,
    }));
  }

  // ========== PRICING ==========
  if (!data.attributes || data.attributes.length === 0) {
    // Single pricing - no combination
    if (data.singlePricing) {
      const priceEntry: PriceItem = {
        cost: data.singlePricing.cost,
        price: data.singlePricing.price,
        // isSale defaults to false; only include sale price when explicitly enabled
        sale_price: data.singlePricing.isSale === true ? data.singlePricing.salePrice : undefined,
      };
      if (priceEntry.cost === undefined) delete priceEntry.cost;
      dto.prices = [priceEntry];
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
          quantity: 0,
          is_out_of_stock: singleVariant.is_out_of_stock ?? false,
        }];
      }
    }
  } else if (data.variants && data.variants.length > 0) {
    // Variant stocks - with combinations
    dto.stocks = buildStocks(data);
    
    // Explicit standalone variants array to support active/inactive states natively
    const variantsMap = new Map<string, any>();
    data.variants.filter((v: any) => v.id !== 'single').forEach((variant: any) => {
      const combination: Record<string, number> = {};
      for (const [attrId, valueId] of Object.entries(variant.attributeValues)) {
        if (valueId && valueId !== '') {
          combination[attrId] = parseInt(valueId as string, 10);
        }
      }
      
      const key = Object.entries(combination)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
        
      if (!variantsMap.has(key) && Object.keys(combination).length > 0) {
        variantsMap.set(key, {
          combination,
          is_active: variant.active !== false
        });
      }
    });
    dto.variants = Array.from(variantsMap.values());
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
    is_group_primary: media.isGroupPrimary,
    sort_order: media.sortOrder,
    combination: media.combination,
  }));
}

interface PriceItem {
  combination?: Record<string, number>;
  cost?: number;
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
  quantity?: number;
  is_out_of_stock: boolean;
}

/**
 * Build prices array from form data
 * Groups by pricing-controlling attributes only
 */
function buildPrices(data: ProductFormData): PriceItem[] {
  // Get pricing-controlling attribute IDs
  const pricingControllingAttrIds = (data.attributes || [])
    .filter(attr => attr.controlsPricing)
    .map(attr => attr.id);

  // If there are attributes but none controls pricing, UI uses single pricing
  // that should apply to all variants (no combination).
  if (pricingControllingAttrIds.length === 0) {
    if (data.singlePricing) {
      const entry: PriceItem = {
        cost: data.singlePricing.cost,
        price: data.singlePricing.price,
        sale_price: data.singlePricing.isSale === true ? data.singlePricing.salePrice : undefined,
      };
      if (entry.cost === undefined) delete entry.cost;
      return [entry];
    }

    // Fallback: if variant pricing exists, use the first entry as the single price.
    if (data.variantPricing && data.variantPricing.length > 0) {
      const first = data.variantPricing[0];
      const entry: PriceItem = {
        cost: first.cost,
        price: first.price,
        sale_price: first.isSale === true ? first.salePrice : undefined,
      };
      if (entry.cost === undefined) delete entry.cost;
      return [entry];
    }

    return [];
  }

  if (!data.variantPricing || data.variantPricing.length === 0) {
    return [];
  }

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
      const entry: PriceItem = {
        combination,
        cost: pricing.cost,
        price: pricing.price,
        // `isSale` defaults to true in the form, so only omit when explicitly false
        sale_price: pricing.isSale === true ? pricing.salePrice : undefined,
      };
      if (entry.cost === undefined) delete entry.cost;
      priceMap.set(key, entry);
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

  const weightMap = new Map<string, WeightItem>();

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

    const key = Object.entries(combination)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    if (!weightMap.has(key) && Object.keys(combination).length > 0 && weight.weight) {
      weightMap.set(key, {
        combination,
        weight: weight.weight,
        length: weight.length,
        width: weight.width,
        height: weight.height,
      });
    }
  }

  return Array.from(weightMap.values());
}

/**
 * Build stocks array from form data
 * Each stock contains combination and quantity
 */
function buildStocks(data: ProductFormData): StockItem[] {
  if (!data.variants || data.variants.length === 0) {
    return [];
  }

  const stockMap = new Map<string, StockItem>();

  for (const variant of data.variants) {
    if (variant.active === false) continue; // Only send stock for active variants
    // Build combination from all attribute values
    const combination: Record<string, number> = {};

    for (const [attrId, valueId] of Object.entries(variant.attributeValues)) {
      if (valueId && valueId !== '') {
        combination[attrId] = parseInt(valueId, 10);
      }
    }

    const key = Object.entries(combination)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    if (!stockMap.has(key) && Object.keys(combination).length > 0) {
      stockMap.set(key, {
        combination,
        quantity: 0,
        is_out_of_stock: variant.is_out_of_stock ?? false,
      });
    }
  }

  return Array.from(stockMap.values());
}


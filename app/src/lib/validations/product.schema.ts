/**
 * Product Validation Schemas
 * Shared between client and server for DRY validation
 */

import { z } from "zod";

// Regex patterns for language validation
const ENGLISH_PATTERN = /^[a-zA-Z0-9\s\p{P}]+$/u;
const ARABIC_PATTERN = /^[\u0600-\u06FF0-9\s\p{P}]+$/u;

// ============================================
// Basic Information Schema
// ============================================
export const basicInformationSchema = z.object({
  nameEn: z
    .string()
    .min(1, "Required")
    .regex(ENGLISH_PATTERN, "Must be in English"),
  nameAr: z
    .string()
    .min(1, "Required")
    .regex(ARABIC_PATTERN, "Must be in Arabic"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  vendorId: z.string().min(1, "Required"),
  shortDescriptionEn: z
    .string()
    .min(1, "Required")
    .regex(ENGLISH_PATTERN, "Must be in English"),
  shortDescriptionAr: z
    .string()
    .min(1, "Required")
    .regex(ARABIC_PATTERN, "Must be in Arabic"),
  longDescriptionEn: z
    .string()
    .min(1, "Required")
    .regex(ENGLISH_PATTERN, "Must be in English"),
  longDescriptionAr: z
    .string()
    .min(1, "Required")
    .regex(ARABIC_PATTERN, "Must be in Arabic"),
  isActive: z.boolean().default(true),
});

// ============================================
// Attribute Schema (for product form)
// ============================================
export const productAttributeValueSchema = z.object({
  id: z.string(),
  value: z.string(),
  order: z.number(),
});

export const productAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(productAttributeValueSchema),
  order: z.number(),
  controlsPricing: z.boolean(),
  controlsWeightDimensions: z.boolean(),
  controlsMedia: z.boolean(),
});

// ============================================
// Pricing Schemas
// ============================================
export const singlePricingSchema = z.object({
  cost: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  price: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  isSale: z.boolean().optional().default(true),
  salePrice: z.number().min(0, "Must be 0 or greater").optional(),
});

export const variantPricingSchema = z.object({
  key: z.string(),
  attributeValues: z.record(z.string(), z.string()),
  cost: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  price: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  isSale: z.boolean().optional().default(true),
  salePrice: z.number().min(0, "Must be 0 or greater").optional(),
});

// ============================================
// Weight & Dimensions Schemas
// ============================================
export const weightDimensionsSchema = z.object({
  weight: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  length: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  width: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  height: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
  unit: z.string().optional(),
});

export const variantWeightDimensionsSchema = weightDimensionsSchema.extend({
  key: z.string(),
  attributeValues: z.record(z.string(), z.string()),
});

// ============================================
// Media Schemas
// ============================================
export const mediaItemSchema = z.object({
  id: z.string(),
  file: z.instanceof(File).nullable(),
  preview: z.string(),
  type: z.enum(["image", "video"]),
  order: z.number(),
  isPrimary: z.boolean(),
});

export const variantMediaSchema = z.object({
  key: z.string(),
  attributeValues: z.record(z.string(), z.string()),
  media: z.array(mediaItemSchema).min(1, "Required"),
});

// ============================================
// Stock Schema
// ============================================
export const variantCombinationSchema = z.object({
  id: z.string(),
  attributeValues: z.record(z.string(), z.string()),
  stock: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
});

// ============================================
// Dynamic Product Form Schema Builder
// ============================================

export interface ProductFormConfig {
  hasPricingAttributes: boolean;
  isWeightVariantBased: boolean;
  isMediaVariantBased: boolean;
  singlePricingIsSale: boolean;
  variantPricingItems: { isSale: boolean }[];
}

/**
 * Creates a dynamic Zod schema based on the current form state
 */
export const createProductSchema = (config: ProductFormConfig) => {
  // Base schema with required fields
  let schema = z.object({
    // Basic Information - always required
    nameEn: z.string().min(1, "Required"),
    nameAr: z.string().min(1, "Required"),
    categoryIds: z.array(z.string()).min(1, "At least one category is required"),
    vendorId: z.string().min(1, "Required"),
    shortDescriptionEn: z.string().min(1, "Required"),
    shortDescriptionAr: z.string().min(1, "Required"),
    longDescriptionEn: z.string().min(1, "Required"),
    longDescriptionAr: z.string().min(1, "Required"),
    isActive: z.boolean().default(true),

    // Attributes - optional
    attributes: z.array(productAttributeSchema).optional(),

    // Flags
    isWeightVariantBased: z.boolean().default(false),
    isMediaVariantBased: z.boolean().default(false),

    // Variants - stock
    variants: z.array(variantCombinationSchema).optional(),
  });

  // Add pricing validation based on whether pricing is variant-based
  if (config.hasPricingAttributes) {
    // Variant pricing required
    schema = schema.extend({
      singlePricing: singlePricingSchema.optional(),
      variantPricing: z.array(variantPricingSchema).min(1, "Required"),
    });
  } else {
    // Single pricing required
    const singlePricingWithSale = config.singlePricingIsSale
      ? singlePricingSchema.extend({
          salePrice: z.number({ message: "Required" }).min(0, "Must be 0 or greater"),
        })
      : singlePricingSchema;

    schema = schema.extend({
      singlePricing: singlePricingWithSale,
      variantPricing: z.array(variantPricingSchema).optional(),
    });
  }

  // Add weight/dimensions validation
  if (config.isWeightVariantBased) {
    schema = schema.extend({
      singleWeightDimensions: weightDimensionsSchema.partial().optional(),
      variantWeightDimensions: z.array(variantWeightDimensionsSchema).min(1, "Required"),
    });
  } else {
    schema = schema.extend({
      singleWeightDimensions: weightDimensionsSchema,
      variantWeightDimensions: z.array(variantWeightDimensionsSchema).optional(),
    });
  }

  // Add media validation
  if (config.isMediaVariantBased) {
    schema = schema.extend({
      singleMedia: z.array(mediaItemSchema).optional(),
      variantMedia: z.array(variantMediaSchema).min(1, "Required"),
    });
  } else {
    schema = schema.extend({
      singleMedia: z.array(mediaItemSchema).min(1, "Required"),
      variantMedia: z.array(variantMediaSchema).optional(),
    });
  }

  return schema;
};

// Type inference from the base schema pattern
export type ProductFormData = z.infer<typeof basicInformationSchema> & {
  attributes?: z.infer<typeof productAttributeSchema>[];
  singlePricing?: z.infer<typeof singlePricingSchema>;
  variantPricing?: z.infer<typeof variantPricingSchema>[];
  isWeightVariantBased: boolean;
  singleWeightDimensions?: z.infer<typeof weightDimensionsSchema>;
  variantWeightDimensions?: z.infer<typeof variantWeightDimensionsSchema>[];
  isMediaVariantBased: boolean;
  singleMedia?: z.infer<typeof mediaItemSchema>[];
  variantMedia?: z.infer<typeof variantMediaSchema>[];
  variants?: z.infer<typeof variantCombinationSchema>[];
};

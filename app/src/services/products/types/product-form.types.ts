/**
 * Product Form Types for Multi-Step Product Creation/Edit
 */

import { z } from "zod";

// Attribute Types
export interface AttributeValue {
  id: string;
  value: string;
  order: number;
}

export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
  order: number;
  controlsPricing: boolean;
  controlsWeightDimensions: boolean;
  controlsMedia: boolean;
}

// Variant Combination
export interface VariantCombination {
  id: string;
  attributeValues: { [attrId: string]: string };
  stock: number;
}

// Pricing Configuration
export interface SinglePricing {
  cost: number;
  price: number;
  isSale?: boolean;
  salePrice?: number;
}

export interface VariantPricing {
  key: string;
  attributeValues: { [attrId: string]: string };
  cost: number;
  price: number;
  isSale?: boolean;
  salePrice?: number;
}

// Weight & Dimensions
export interface WeightDimensions {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface VariantWeightDimensions {
  key: string;
  attributeValues: { [attrId: string]: string };
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

// Media Configuration
export interface MediaItem {
  id: string;
  file: File | null; // Store actual File object for upload (null for existing media from URLs)
  preview: string; // Blob URL for preview or remote URL for existing media
  type: "image" | "video";
  order: number;
  isPrimary: boolean;
}

export interface VariantMedia {
  key: string;
  attributeValues: { [attrId: string]: string };
  media: MediaItem[];
}

// Product Form Data Schema
export const productFormSchema = z.object({
  // Basic Information
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"), // Changed from categoryId to categoryIds
  vendorId: z.string().optional(),
  brandId: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  shortDescriptionAr: z.string().optional(),
  longDescriptionEn: z.string().optional(),
  longDescriptionAr: z.string().optional(),
  visible: z.boolean().default(true),

  // Attributes
  attributes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      values: z.array(
        z.object({
          id: z.string(),
          value: z.string(),
          order: z.number(),
        })
      ),
      order: z.number(),
      controlsPricing: z.boolean(),
      controlsWeightDimensions: z.boolean(),
      controlsMedia: z.boolean(),
    })
  ).optional(),

  // Pricing
  singlePricing: z
    .object({
      cost: z.number().min(0),
      price: z.number().min(0),
      isSale: z.boolean().optional(),
      salePrice: z.number().min(0).optional(),
    })
    .optional(),
  variantPricing: z
    .array(
      z.object({
        key: z.string(),
        attributeValues: z.record(z.string(), z.string()),
        cost: z.number().min(0),
        price: z.number().min(0),
        isSale: z.boolean().optional(),
        salePrice: z.number().min(0).optional(),
      })
    )
    .optional(),

  // Weight & Dimensions
  isWeightVariantBased: z.boolean().default(false),
  singleWeightDimensions: z
    .object({
      weight: z.number().min(0).optional(),
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      unit: z.string().optional(),
    })
    .optional(),
  variantWeightDimensions: z
    .array(
      z.object({
        key: z.string(),
        attributeValues: z.record(z.string(), z.string()),
        weight: z.number().min(0).optional(),
        length: z.number().min(0).optional(),
        width: z.number().min(0).optional(),
        height: z.number().min(0).optional(),
        unit: z.string().optional(),
      })
    )
    .optional(),

  // Media
  isMediaVariantBased: z.boolean().default(false),
  singleMedia: z
    .array(
      z.object({
        id: z.string(),
        file: z.instanceof(File).nullable(), // Nullable for existing media loaded from URLs
        preview: z.string(),
        type: z.enum(["image", "video"]),
        order: z.number(),
        isPrimary: z.boolean(),
      })
    )
    .optional(),
  variantMedia: z
    .array(
      z.object({
        key: z.string(),
        attributeValues: z.record(z.string(), z.string()),
        media: z.array(
          z.object({
            id: z.string(),
            file: z.instanceof(File).nullable(), // Nullable for existing media loaded from URLs
            preview: z.string(),
            type: z.enum(["image", "video"]),
            order: z.number(),
            isPrimary: z.boolean(),
          })
        ),
      })
    )
    .optional(),

  // Stock (variant combinations)
  variants: z.array(
    z.object({
      id: z.string(),
      attributeValues: z.record(z.string(), z.string()),
      stock: z.number().min(0, "Stock is required"),
    })
  ).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// Form Step
export type FormStep = 1 | 2 | 3 | 4 | 5 | 6;

// Form State
export interface ProductFormState {
  currentStep: FormStep;
  formData: Partial<ProductFormData>;
  isDraft: boolean;
  completionPercentage: number;
  validationErrors: { [key: string]: string };
}

// Predefined Attributes
export const PREDEFINED_ATTRIBUTES = [
  "Color",
  "Size",
  "RAM",
  "Storage",
  "Material",
  "Style",
] as const;

export type PredefinedAttribute = (typeof PREDEFINED_ATTRIBUTES)[number];

// Predefined Attribute Values
export const PREDEFINED_ATTRIBUTE_VALUES: Record<string, string[]> = {
  Color: ["Red", "Blue", "Black", "White", "Green", "Yellow", "Pink", "Purple", "Orange", "Gray"],
  Size: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  RAM: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
  Storage: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
  Material: ["Cotton", "Polyester", "Leather", "Wool", "Silk", "Denim", "Linen"],
  Style: ["Casual", "Formal", "Sport", "Classic", "Modern", "Vintage"],
};

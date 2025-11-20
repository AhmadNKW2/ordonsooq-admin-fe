/**
 * Product Types and Interfaces
 */

import { z } from "zod";

// Category Schema (matches backend)
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  level: z.number(),
  isActive: z.boolean(),
  parentId: z.number().optional().nullable(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Vendor Schema (matches backend)
export const vendorSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;

// Attribute Schema (matches backend)
export const attributeValueSchema = z.object({
  id: z.number(),
  attribute_id: z.number(),
  value_en: z.string(),
  value_ar: z.string(),
  is_active: z.boolean(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export const attributeSchema = z.object({
  id: z.number(),
  name_en: z.string(),
  name_ar: z.string(),
  is_active: z.boolean(),
  values: z.array(attributeValueSchema).optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type AttributeValue = z.infer<typeof attributeValueSchema>;
export type Attribute = z.infer<typeof attributeSchema>;

// Product Schema for validation (matches backend)
export const productSchema = z.object({
  id: z.number(),
  name_en: z.string().min(1, "Product name is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  short_description_en: z.string().optional().nullable(),
  short_description_ar: z.string().optional().nullable(),
  long_description_en: z.string().optional().nullable(),
  long_description_ar: z.string().optional().nullable(),
  pricing_type: z.enum(["single", "variant"]),
  category_id: z.number(),
  vendor_id: z.number().optional().nullable(),
  sku: z.string(),
  is_active: z.boolean(),
  average_rating: z.number().optional().nullable(),
  total_ratings: z.number().optional().nullable(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// TypeScript type inferred from schema
export type Product = z.infer<typeof productSchema>;

// Extended Product with relations (for detail view)
export interface ProductMedia {
  id: number;
  product_id: number;
  url: string;
  type: 'image' | 'video';
  sort_order: number;
  is_primary: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProductPricing {
  id: number;
  product_id: number;
  cost: string;
  price: string;
  sale_price?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProductWeight {
  id: number;
  product_id: number;
  weight?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProductStock {
  id: number;
  product_id: number;
  stock_quantity: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProductDetail extends Product {
  category?: Category;
  vendor?: Omit<Vendor, 'isActive' | 'createdAt' | 'updatedAt'> & {
    is_active: boolean;
    created_at?: string | Date;
    updated_at?: string | Date;
  };
  media?: ProductMedia[];
  pricing?: ProductPricing[];
  weight?: ProductWeight[];
  stock?: ProductStock[];
  variant_pricing?: any[];
  variant_media?: any[];
  variant_weight?: any[];
  attributes?: any[];
}

// Product Filter (matches backend FilterProductDto)
export interface ProductFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

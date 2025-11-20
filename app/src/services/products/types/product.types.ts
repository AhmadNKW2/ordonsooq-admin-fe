/**
 * Product Types and Interfaces
 */

import { z } from "zod";

// Category Schema
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  level: z.number(),
  isActive: z.boolean(),
  parentId: z.string().optional().nullable(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Product Schema for validation
export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.string().or(z.number()).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  discountPrice: z.string().or(z.number()).optional().transform((val) => val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined),
  category: categorySchema.optional(),
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().nonnegative("Stock cannot be negative"),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  averageRating: z.string().or(z.number()).optional().transform((val) => val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined),
  totalRatings: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

// TypeScript type inferred from schema
export type Product = z.infer<typeof productSchema>;

// Create Product DTO
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

// Update Product DTO
export type UpdateProductDto = Partial<CreateProductDto>;

// Product Filter (matches backend FilterProductDto)
export interface ProductFilters {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "price" | "averageRating" | "stock";
  sortOrder?: "ASC" | "DESC";
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxRating?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  search?: string;
}

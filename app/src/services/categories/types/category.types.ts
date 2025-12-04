/**
 * Category Types
 * Matches the backend API structure
 */

import { z } from "zod";

// Base Category Schema (without children for self-reference)
const baseCategorySchema = z.object({
  id: z.number(),
  name_en: z.string(),
  name_ar: z.string(),
  description_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  visible: z.boolean().optional(),
  is_active: z.boolean(),
  parent_id: z.number().optional().nullable(),
  level: z.number().optional(),
  status: z.enum(["active", "archived"]).optional(),
  archived_at: z.string().or(z.date()).optional().nullable(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Archived Product (included in archived category response)
export interface ArchivedCategoryProduct {
  id: number;
  name_en: string;
  name_ar: string;
  sku?: string;
  image?: string | null;
  archived_at?: string | Date | null;
  archived_by?: number | null;
}

// Archived Subcategory (included in archived category response)
export interface ArchivedSubcategory {
  id: number;
  name_en: string;
  name_ar: string;
  image?: string | null;
  archived_at?: string | Date | null;
  archived_by?: number | null;
  archivedProductsCount: number;
  archivedSubcategoriesCount: number;
}

// Category type with optional children and archived data
export type Category = z.infer<typeof baseCategorySchema> & {
  children?: Category[];
  // Included in archived category list response
  archivedProducts?: ArchivedCategoryProduct[];
  archivedSubcategories?: ArchivedSubcategory[];
  wasLive?: boolean;
  wasDraft?: boolean;
};

// Category Schema for validation
export const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
  children: z.lazy(() => z.array(categorySchema)).optional(),
});

// Create Category DTO
export interface CreateCategoryDto {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  visible?: boolean;
  is_active?: boolean;
  parent_id?: number | null;
  image?: File | null;
  product_ids?: number[]; // Assign products during creation
}

// Update Category DTO
export interface UpdateCategoryDto {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  visible?: boolean;
  is_active?: boolean;
  parent_id?: number | null;
  image?: File | null;
  product_ids?: number[]; // Sync products during update
}

// Filter Categories DTO
export interface FilterCategoriesDto {
  search?: string;
  visible?: boolean;
  status?: "active" | "archived";
  is_active?: boolean;
}

// Reorder Categories DTO
export interface ReorderCategoriesDto {
  categories: { id: number; sortOrder: number }[];
}

// Product Restore Options
export interface ProductRestoreOptions {
  restoreAll?: boolean;
  product_ids?: number[];
}

// Subcategory Restore Options (recursive)
export interface SubcategoryRestoreOptions {
  id: number;
  products?: ProductRestoreOptions;
  restoreAllSubcategories?: boolean;
  subcategories?: SubcategoryRestoreOptions[];
}

// Restore Category DTO (updated with granular control)
export interface RestoreCategoryDto {
  // Parent handling
  new_parent_id?: number | null;
  makeRoot?: boolean;
  
  // Product restoration for this category
  products?: ProductRestoreOptions;
  
  // Subcategory restoration
  restoreAllSubcategories?: boolean;
  subcategories?: SubcategoryRestoreOptions[];
  
  // Legacy support
  restoreAllContents?: boolean;
  newParentId?: number | null; // Legacy alias
}

// Restore Result Detail
export interface RestoreResultDetail {
  categoryId: number;
  categoryName: string;
  productsRestored: number;
  productsSkipped: number;
  subcategoriesRestored: number;
}

// Category Restore Result
export interface CategoryRestoreResult {
  category: Category;
  restoredCategories: number;
  restoredProducts: number;
  skippedProducts: number;
  skippedCategories: number;
  details: RestoreResultDetail[];
}

// Permanent Delete Category DTO
export interface PermanentDeleteCategoryDto {
  deleteProducts?: boolean;
  moveProductsToCategoryId?: number;
}

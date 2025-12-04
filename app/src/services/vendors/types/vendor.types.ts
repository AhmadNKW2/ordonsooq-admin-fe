/**
 * Vendor Types
 * Matches the backend API structure
 */

import { z } from "zod";

// Archived Product (included in archived vendor response)
export interface ArchivedVendorProduct {
  id: number;
  name_en: string;
  name_ar: string;
  sku?: string;
  image?: string | null;
  archived_at?: string | Date | null;
  archived_by?: number | null;
}

// Vendor Schema (matches backend)
export const vendorSchema = z.object({
  id: z.number(),
  name_en: z.string(),
  name_ar: z.string(),
  description_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  visible: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
  status: z.enum(["active", "archived"]).optional(),
  archived_at: z.string().or(z.date()).optional().nullable(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
  // Included in archived vendor list response
  archivedProducts: z.array(z.any()).optional(),
});

export type Vendor = z.infer<typeof vendorSchema> & {
  archivedProducts?: ArchivedVendorProduct[];
};

// Create Vendor DTO
export interface CreateVendorDto {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  visible?: boolean;
  logo?: File | null;
  product_ids?: number[]; // Assign products during creation
}

// Update Vendor DTO
export interface UpdateVendorDto {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  visible?: boolean;
  logo?: File | null;
  product_ids?: number[]; // Sync products during update
}

// Reorder Vendors DTO
export interface ReorderVendorsDto {
  vendors: { id: number; sort_order: number }[];
}

// Permanent Delete Vendor DTO
export interface PermanentDeleteVendorDto {
  deleteProducts?: boolean;
  moveProductsToVendorId?: number;
}

// Restore Vendor DTO
export interface RestoreVendorDto {
  restoreAllProducts?: boolean;
  product_ids?: number[];
}

// Restore Result
export interface VendorRestoreResult {
  vendor: Vendor;
  restoredProducts: number;
  skippedProducts: number;
}

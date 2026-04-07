import { Category } from "./category.types";

export interface CategoryUrlMapping {
  id: number;
  category_id: number;
  vendor_id: number;
  url: string;
  category?: Pick<Category, "id" | "name_en" | "name_ar"> | null;
  vendor?: {
    id: number;
    name_en?: string | null;
    name_ar?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateCategoryUrlMappingDto {
  category_id: number;
  vendor_id: number;
  url: string;
}

export interface UpdateCategoryUrlMappingDto {
  category_id?: number;
  vendor_id?: number;
  url?: string;
}

export interface CategoryUrlMappingsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  vendor_id?: number;
  [key: string]: string | number | boolean | undefined;
}
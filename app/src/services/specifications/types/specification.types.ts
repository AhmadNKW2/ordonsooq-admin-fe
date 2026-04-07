/**
 * Specification Types and Interfaces
 */

export interface SpecificationValue {
  id: number;
  specification_id: number;
  parent_value_id?: number | null;
  value_en: string;
  value_ar: string;
  sort_order: number;
  is_active: boolean;
  level?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SpecificationCategorySummary {
  id: number;
  name_en?: string | null;
  name_ar?: string | null;
}

export interface Specification {
  id: number;
  name_en: string;
  name_ar: string;
  for_all_categories?: boolean;
  unit_en?: string | null;
  unit_ar?: string | null;
  parent_id?: number | null;
  parent_value_id?: number | null;
  list_separately: boolean;
  sort_order: number;
  is_active: boolean;
  category_ids?: number[];
  categories?: SpecificationCategorySummary[];
  level?: number;
  values: SpecificationValue[];
  children?: Specification[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductSpecificationValue {
  id: number;
  product_id: number;
  specification_value_id: number;
  specification_value: SpecificationValue;
}

export interface CreateSpecificationValueDto {
  value_en: string;
  value_ar: string;
  parent_value_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateSpecificationDto {
  name_en: string;
  name_ar: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  for_all_categories?: boolean;
  list_separately?: boolean;
  sort_order?: number;
  is_active?: boolean;
  category_ids?: number[];
  values?: CreateSpecificationValueDto[];
}

export interface UpdateSpecificationValueInDto {
  id?: number;
  value_en?: string;
  value_ar?: string;
  parent_value_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateSpecificationDto {
  name_en?: string;
  name_ar?: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  for_all_categories?: boolean;
  list_separately?: boolean;
  sort_order?: number;
  is_active?: boolean;
  category_ids?: number[];
  values?: UpdateSpecificationValueInDto[];
}

export interface AddSpecificationValueDto {
  value_en: string;
  value_ar: string;
  parent_value_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateSpecificationValueDto {
  value_en?: string;
  value_ar?: string;
  parent_value_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ReorderSpecificationDto {
  id: number;
  sort_order: number;
}

export interface ReorderSpecificationValueDto {
  id: number;
  sort_order: number;
}

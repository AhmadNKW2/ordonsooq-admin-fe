export interface Partner {
  id: number;
  full_name: string;
  company_name: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerListParams {
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "full_name" | "company_name";
  sortOrder?: "ASC" | "DESC";
  search?: string;
}

export interface CreatePartnerDto {
  full_name: string;
  company_name: string;
  phone_number: string;
}

export interface UpdatePartnerDto {
  full_name?: string;
  company_name?: string;
  phone_number?: string;
}
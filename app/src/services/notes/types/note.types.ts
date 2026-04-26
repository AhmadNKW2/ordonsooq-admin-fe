export interface NoteProduct {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  [key: string]: any;
}

export interface Note {
  id: number;
  product_id?: number;
  notes?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  user_id?: number | null;
  product?: NoteProduct;
  created_at?: string;
  updated_at?: string;
}

export interface NoteListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface NoteListResponse {
  items: Note[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

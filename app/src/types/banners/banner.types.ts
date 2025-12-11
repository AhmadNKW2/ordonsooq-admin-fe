export type BannerStatus = "active" | "inactive";

export interface Banner {
  id: number;
  image: string;
  link?: string;
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannerListResponse {
  data: Banner[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


export const getBanners = async (params?: Record<string, any>): Promise<BannerListResponse> => {
  return await httpClient.get<BannerListResponse>("/banners", params);
};

export const getBannerById = async (id: number): Promise<ApiResponse<Banner>> => {
  return await httpClient.get<ApiResponse<Banner>>(`/banners/${id}`);
};

export const createBanner = async (formData: FormData): Promise<Banner> => {
  return await httpClient.postFormData<Banner>("/banners", formData);
};

export const updateBanner = async (id: number, formData: FormData): Promise<Banner> => {
  return await httpClient.patchFormData<Banner>(`/banners/${id}`, formData);
};

export const deleteBanner = async (id: number): Promise<void> => {
  await httpClient.delete(`/banners/${id}`);
};

export const toggleBannerStatus = async (id: number): Promise<Banner> => {
  return await httpClient.post<Banner>(`/banners/${id}/toggle-status`);
};

export const reorderBanners = async (banner_ids: number[]): Promise<void> => {
  await httpClient.post(`/banners/reorder`, { banner_ids });
};
import { Banner, BannerListResponse } from "../../types/banners/banner.types";
import { httpClient } from "../../lib/api/http-client";
import { ApiResponse } from "../../types/common.types";

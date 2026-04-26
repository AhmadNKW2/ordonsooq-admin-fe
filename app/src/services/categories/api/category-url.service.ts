import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse, PaginatedApiResponse } from "../../../types/common.types";
import {
  CategoryUrlMapping,
  CategoryUrlMappingsQueryParams,
  CreateCategoryUrlMappingDto,
  UpdateCategoryUrlMappingDto,
} from "../types/category-url.types";

type CategoryUrlMappingsResponse =
  | ApiResponse<CategoryUrlMapping[]>
  | PaginatedApiResponse<CategoryUrlMapping>;

class CategoryUrlService {
  private endpoint = "/categories/urls";

  async getCategoryUrlMappings(
    params?: CategoryUrlMappingsQueryParams
  ): Promise<CategoryUrlMappingsResponse> {
    return httpClient.get<CategoryUrlMappingsResponse>(this.endpoint, params);
  }

  async getCategoryUrls(
    categoryId: number,
    params?: CategoryUrlMappingsQueryParams
  ): Promise<CategoryUrlMappingsResponse> {
    return httpClient.get<CategoryUrlMappingsResponse>(
      `/categories/${categoryId}/urls`,
      params
    );
  }

  async getCategoryUrlMapping(urlId: number): Promise<ApiResponse<CategoryUrlMapping>> {
    return httpClient.get<ApiResponse<CategoryUrlMapping>>(
      `${this.endpoint}/${urlId}`
    );
  }

  async getVendorCategoryUrls(
    vendorId: number,
    params?: CategoryUrlMappingsQueryParams
  ): Promise<CategoryUrlMappingsResponse> {
    return httpClient.get<CategoryUrlMappingsResponse>(
      `/categories/vendor/${vendorId}/urls`,
      params
    );
  }

  async createCategoryUrlMapping(
    data: CreateCategoryUrlMappingDto
  ): Promise<ApiResponse<CategoryUrlMapping>> {
    return httpClient.post<ApiResponse<CategoryUrlMapping>>(this.endpoint, data);
  }

  async updateCategoryUrlMapping(
    urlId: number,
    data: UpdateCategoryUrlMappingDto
  ): Promise<ApiResponse<CategoryUrlMapping>> {
    return httpClient.patch<ApiResponse<CategoryUrlMapping>>(
      `${this.endpoint}/${urlId}`,
      data
    );
  }

  async deleteCategoryUrlMapping(urlId: number): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${urlId}`);
  }
}

export const categoryUrlService = new CategoryUrlService();
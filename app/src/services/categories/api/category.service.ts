/**
 * Category API Service
 * Handles all category-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import { Category } from "../../products/types/product.types";

class CategoryService {
  private endpoint = "/categories";

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return httpClient.get<ApiResponse<Category[]>>(this.endpoint);
  }

  /**
   * Get category tree
   */
  async getCategoryTree(): Promise<ApiResponse<Category[]>> {
    return httpClient.get<ApiResponse<Category[]>>(`${this.endpoint}/tree`);
  }

  /**
   * Get main categories
   */
  async getMainCategories(): Promise<ApiResponse<Category[]>> {
    return httpClient.get<ApiResponse<Category[]>>(`${this.endpoint}/main`);
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return httpClient.get<ApiResponse<Category>>(`${this.endpoint}/${id}`);
  }
}

export const categoryService = new CategoryService();

/**
 * Product API Service
 * Handles all product-related API calls
 */

import { BaseService } from "../../../lib/api/base.service";
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
} from "../types/product.types";
import {
  ApiResponse,
  PaginatedResponse,
  PaginatedApiResponse,
} from "../../../types/common.types";
import { httpClient } from "../../../lib/api/http-client";

class ProductService extends BaseService<Product> {
  protected endpoint = "/products";

  /**
   * Get all products with filters and pagination
   */
  async getProducts(
    params?: ProductFilters
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    // Call the API
    const response = await httpClient.get<PaginatedApiResponse<Product>>(
      this.endpoint,
      params
    );

    // Transform backend response (meta) to frontend format (pagination)
    return {
      success: response.success,
      message: response.message,
      data: {
        data: response.data,
        pagination: response.meta,
      },
    };
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string | number): Promise<ApiResponse<Product>> {
    return this.getById(id);
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductDto): Promise<ApiResponse<Product>> {
    return this.create(data);
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string | number,
    data: UpdateProductDto
  ): Promise<ApiResponse<Product>> {
    return this.update(id, data);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string | number): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(
    id: string | number,
    isActive: boolean
  ): Promise<ApiResponse<Product>> {
    return this.patch(id, { isActive });
  }
}

export const productService = new ProductService();

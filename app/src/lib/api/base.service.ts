/**
 * Base Service - Abstract class for API services
 * Following the Repository pattern
 */

import { httpClient } from "./http-client";
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "../../types/common.types";

export abstract class BaseService<T> {
  protected abstract endpoint: string;

  /**
   * Get all items with optional pagination and filters
   */
  protected async getAll(
    params?: QueryParams
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return httpClient.get<ApiResponse<PaginatedResponse<T>>>(
      this.endpoint,
      params
    );
  }

  /**
   * Get a single item by ID
   */
  protected async getById(id: string | number): Promise<ApiResponse<T>> {
    return httpClient.get<ApiResponse<T>>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new item
   */
  protected async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return httpClient.post<ApiResponse<T>>(this.endpoint, data);
  }

  /**
   * Update an existing item
   */
  protected async update(
    id: string | number,
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    return httpClient.put<ApiResponse<T>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Partially update an item
   */
  protected async patch(
    id: string | number,
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    return httpClient.patch<ApiResponse<T>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete an item
   */
  protected async delete(id: string | number): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}

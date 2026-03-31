/**
 * Specification API Service
 * Handles all specification-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import {
  Specification,
  SpecificationValue,
  CreateSpecificationDto,
  UpdateSpecificationDto,
  AddSpecificationValueDto,
  UpdateSpecificationValueDto,
} from "../types/specification.types";

class SpecificationService {
  private endpoint = "/specifications";

  /**
   * Get all specifications
   */
  async getSpecifications(): Promise<Specification[]> {
    return httpClient.get<Specification[]>(this.endpoint);
  }

  /**
   * Get a single specification by ID
   */
  async getSpecification(id: number): Promise<Specification> {
    return httpClient.get<Specification>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new specification
   */
  async createSpecification(data: CreateSpecificationDto): Promise<Specification> {
    return httpClient.post<Specification>(this.endpoint, data);
  }

  /**
   * Update an specification
   */
  async updateSpecification(id: number, data: UpdateSpecificationDto): Promise<Specification> {
    return httpClient.patch<Specification>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete an specification
   */
  async deleteSpecification(id: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Add a value to an specification
   */
  async addSpecificationValue(specificationId: number, data: AddSpecificationValueDto): Promise<SpecificationValue> {
    return httpClient.post<SpecificationValue>(`${this.endpoint}/${specificationId}/values`, data);
  }

  /**
   * Update an specification value
   */
  async updateSpecificationValue(valueId: number, data: UpdateSpecificationValueDto): Promise<SpecificationValue> {
    return httpClient.patch<SpecificationValue>(`${this.endpoint}/values/${valueId}`, data);
  }

  /**
   * Delete an specification value
   */
  async deleteSpecificationValue(valueId: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/values/${valueId}`);
  }

  /**
   * Reorder specifications (bulk update sort_order)
   */
  async reorderSpecifications(orders: { id: number; sort_order: number }[]): Promise<void> {
    return httpClient.put<void>(`${this.endpoint}/reorder`, {
      specifications: orders
    });
  }

  /**
   * Reorder specification values (bulk update sort_order)
   */
  async reorderSpecificationValues(specificationId: number, orders: { id: number; sort_order: number }[]): Promise<void> {
    return httpClient.put<void>(`${this.endpoint}/${specificationId}/values/reorder`, {
      values: orders
    });
  }
}

export const specificationService = new SpecificationService();

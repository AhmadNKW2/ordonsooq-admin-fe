/**
 * Attribute API Service
 * Handles all attribute-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import {
  Attribute,
  AttributeValue,
  CreateAttributeDto,
  UpdateAttributeDto,
  AddAttributeValueDto,
  UpdateAttributeValueDto,
} from "../types/attribute.types";

class AttributeService {
  private endpoint = "/attributes";

  /**
   * Get all attributes
   */
  async getAttributes(): Promise<Attribute[]> {
    return httpClient.get<Attribute[]>(this.endpoint);
  }

  /**
   * Get a single attribute by ID
   */
  async getAttribute(id: number): Promise<Attribute> {
    return httpClient.get<Attribute>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new attribute
   */
  async createAttribute(data: CreateAttributeDto): Promise<Attribute> {
    return httpClient.post<Attribute>(this.endpoint, data);
  }

  /**
   * Update an attribute
   */
  async updateAttribute(id: number, data: UpdateAttributeDto): Promise<Attribute> {
    return httpClient.patch<Attribute>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete an attribute
   */
  async deleteAttribute(id: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Add a value to an attribute
   */
  async addAttributeValue(attributeId: number, data: AddAttributeValueDto): Promise<AttributeValue> {
    return httpClient.post<AttributeValue>(`${this.endpoint}/${attributeId}/values`, data);
  }

  /**
   * Update an attribute value
   */
  async updateAttributeValue(valueId: number, data: UpdateAttributeValueDto): Promise<AttributeValue> {
    return httpClient.patch<AttributeValue>(`${this.endpoint}/values/${valueId}`, data);
  }

  /**
   * Delete an attribute value
   */
  async deleteAttributeValue(valueId: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/values/${valueId}`);
  }

  /**
   * Reorder attributes (bulk update sort_order)
   */
  async reorderAttributes(orders: { id: number; sort_order: number }[]): Promise<void> {
    return httpClient.put<void>(`${this.endpoint}/reorder`, {
      attributes: orders
    });
  }

  /**
   * Reorder attribute values (bulk update sort_order)
   */
  async reorderAttributeValues(attributeId: number, orders: { id: number; sort_order: number }[]): Promise<void> {
    return httpClient.put<void>(`${this.endpoint}/${attributeId}/values/reorder`, {
      values: orders
    });
  }
}

export const attributeService = new AttributeService();

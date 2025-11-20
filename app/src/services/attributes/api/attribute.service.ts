/**
 * Attribute API Service
 * Handles all attribute-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import { Attribute } from "../../products/types/product.types";

class AttributeService {
  private endpoint = "/attributes";

  /**
   * Get all attributes
   */
  async getAttributes(): Promise<ApiResponse<Attribute[]>> {
    return httpClient.get<ApiResponse<Attribute[]>>(this.endpoint);
  }

  /**
   * Get a single attribute by ID
   */
  async getAttribute(id: number): Promise<ApiResponse<Attribute>> {
    return httpClient.get<ApiResponse<Attribute>>(`${this.endpoint}/${id}`);
  }
}

export const attributeService = new AttributeService();

/**
 * Vendor API Service
 * Handles all vendor-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import { Vendor } from "../../products/types/product.types";

class VendorService {
  private endpoint = "/vendors";

  /**
   * Get all vendors
   */
  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    return httpClient.get<ApiResponse<Vendor[]>>(this.endpoint);
  }

  /**
   * Get a single vendor by ID
   */
  async getVendor(id: number): Promise<ApiResponse<Vendor>> {
    return httpClient.get<ApiResponse<Vendor>>(`${this.endpoint}/${id}`);
  }
}

export const vendorService = new VendorService();

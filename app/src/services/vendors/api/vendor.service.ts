/**
 * Vendor API Service
 * Handles all vendor-related API calls
 */

import { httpClient } from "../../../lib/api/http-client";
import { ApiResponse } from "../../../types/common.types";
import {
  Vendor,
  CreateVendorDto,
  UpdateVendorDto,
  ReorderVendorsDto,
  PermanentDeleteVendorDto,
  RestoreVendorDto,
  VendorRestoreResult,
} from "../types/vendor.types";

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

  /**
   * Create a new vendor
   * Uses FormData for file upload
   */
  async createVendor(data: CreateVendorDto): Promise<ApiResponse<Vendor>> {
    const formData = new FormData();
    
    formData.append("name_en", data.name_en);
    formData.append("name_ar", data.name_ar);
    
    if (data.description_en) {
      formData.append("description_en", data.description_en);
    }
    
    if (data.description_ar) {
      formData.append("description_ar", data.description_ar);
    }
    
    if (data.visible !== undefined) {
      formData.append("visible", String(data.visible));
    }
    
    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return httpClient.postFormData<ApiResponse<Vendor>>(
      this.endpoint,
      formData
    );
  }

  /**
   * Update a vendor
   * Uses FormData for file upload (PATCH with form-data)
   */
  async updateVendor(
    id: number,
    data: UpdateVendorDto
  ): Promise<ApiResponse<Vendor>> {
    const formData = new FormData();
    
    if (data.name_en !== undefined) {
      formData.append("name_en", data.name_en);
    }
    
    if (data.name_ar !== undefined) {
      formData.append("name_ar", data.name_ar);
    }
    
    if (data.description_en !== undefined) {
      formData.append("description_en", data.description_en);
    }
    
    if (data.description_ar !== undefined) {
      formData.append("description_ar", data.description_ar);
    }
    
    if (data.visible !== undefined) {
      formData.append("visible", String(data.visible));
    }
    
    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return httpClient.patchFormData<ApiResponse<Vendor>>(
      `${this.endpoint}/${id}`,
      formData
    );
  }

  /**
   * Reorder vendors
   */
  async reorderVendors(data: ReorderVendorsDto): Promise<ApiResponse<void>> {
    return httpClient.put<ApiResponse<void>>(`${this.endpoint}/reorder`, data);
  }

  /**
   * Archive a vendor (soft delete)
   */
  async archiveVendor(id: number): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(`${this.endpoint}/${id}/archive`);
  }

  /**
   * Restore an archived vendor
   */
  async restoreVendor(id: number, data?: RestoreVendorDto): Promise<ApiResponse<VendorRestoreResult>> {
    return httpClient.post<ApiResponse<VendorRestoreResult>>(`${this.endpoint}/${id}/restore`, data);
  }

  /**
   * Get archived vendors (trash view)
   * Now includes archivedProducts for each vendor
   */
  async getArchivedVendors(): Promise<ApiResponse<Vendor[]>> {
    return httpClient.get<ApiResponse<Vendor[]>>(`${this.endpoint}/archive/list`);
  }

  /**
   * Permanently delete a vendor
   */
  async permanentDeleteVendor(id: number, data?: PermanentDeleteVendorDto): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}/permanent`);
  }

  /**
   * Delete a vendor (legacy - now archives instead)
   * @deprecated Use archiveVendor instead
   */
  async deleteVendor(id: number): Promise<ApiResponse<void>> {
    return this.archiveVendor(id);
  }

  // ============================================
  // Vendor Products Management
  // ============================================

  /**
   * Get products for a vendor
   * Returns { vendor, products }
   */
  async getProducts(id: number): Promise<ApiResponse<{ vendor: Vendor; products: any[] }>> {
    return httpClient.get<ApiResponse<{ vendor: Vendor; products: any[] }>>(`${this.endpoint}/${id}/products`);
  }

  /**
   * Assign products to a vendor
   */
  async assignProducts(id: number, product_ids: number[]): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(`${this.endpoint}/${id}/products`, { product_ids });
  }

  /**
   * Remove products from a vendor
   */
  async removeProducts(id: number, product_ids: number[]): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}/products`, { product_ids });
  }
}

export const vendorService = new VendorService();

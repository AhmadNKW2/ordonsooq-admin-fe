/**
 * Product API Service
 * Handles all product-related API calls including variants
 */

import { BaseService } from "../../../lib/api/base.service";
import {
  Product,
  ProductDetail,
  ProductFilters,
} from "../types/product.types";
import {
  ApiResponse,
  PaginatedResponse,
  PaginatedApiResponse,
} from "../../../types/common.types";
import { httpClient } from "../../../lib/api/http-client";

// Product Attributes
export interface ProductAttributeDto {
  attribute_id: number;
  controls_pricing: boolean;
  controls_media: boolean;
  controls_weight: boolean;
}

export interface AddProductAttributesDto {
  attributes: ProductAttributeDto[];
}

// Pricing
export interface SinglePricingDto {
  cost: number;
  price: number;
  sale_price?: number;
}

export interface VariantPricingDto {
  attribute_value_id: number;
  cost: number;
  price: number;
  sale_price?: number;
}

//  Product Creation DTOs
export interface ProductAttributeInput {
  attribute_id: number;
  controls_pricing: boolean;
  controls_media: boolean;
  controls_weight: boolean;
}

export interface SinglePricingInput {
  cost: number;
  price: number;
  sale_price?: number;
}

export interface VariantPricingInput {
  combination: Record<string, number>; // { "Color": 1, "Size": 3 }
  cost: number;
  price: number;
  sale_price?: number;
}

export interface MediaInput {
  media_url: string;
  media_type: 'image' | 'video';
  sort_order?: number;
  is_primary?: boolean;
}

export interface VariantMediaInput {
  combination: Record<string, number>;
  media_url: string;
  media_type: 'image' | 'video';
  sort_order?: number;
  is_primary?: boolean;
}

export interface WeightInput {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface VariantWeightInput {
  combination: Record<string, number>;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface StockInput {
  combination: Record<string, number>;
  stock_quantity: number;
}

// ==================== CREATE PRODUCT DTO ====================
export interface CreateProductDto {
  // Basic product info
  name_en: string;
  name_ar: string;
  sku?: string;
  short_description_en: string;
  short_description_ar: string;
  long_description_en: string;
  long_description_ar: string;
  pricing_type: 'single' | 'variant';
  category_id: number;
  vendor_id?: number;
  is_active?: boolean;

  // Attributes
  attributes?: ProductAttributeInput[];

  // Pricing
  single_pricing?: SinglePricingInput;
  variant_pricing?: VariantPricingInput[];

  // Weight
  product_weight?: WeightInput;
  variant_weights?: VariantWeightInput[];

  // Stock
  stock?: StockInput[];
}

// Media
export interface ProductMediaDto {
  url: string;
  type: "image" | "video";
  sort_order: number;
  is_primary: boolean;
}

export interface VariantMediaDto {
  attribute_value_id: number;
  url: string;
  type: "image" | "video";
  sort_order: number;
  is_primary: boolean;
}

// Weight
export interface ProductWeightDto {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface VariantWeightDto {
  attribute_value_id: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

// Stock
export interface UpdateStockDto {
  quantity: number;
}

// ==================== UPDATE PRODUCT DTOs ====================

// Media Management
export interface UpdateMediaDto {
  media_id: number;
  sort_order?: number;
  is_primary?: boolean;
}

export interface DeleteMediaDto {
  media_id: number;
  is_variant?: boolean;
}

export interface ReorderMediaDto {
  media_id: number;
  sort_order: number;
}

export interface MediaManagementDto {
  update_media?: UpdateMediaDto[];
  delete_media?: DeleteMediaDto[];
  reorder_media?: ReorderMediaDto[];
  set_primary_media_id?: number;
  is_variant_media?: boolean;
}

// Attributes Management
export interface UpdateProductAttributeInputDto {
  attribute_id: number;
  controls_pricing?: boolean;
  controls_media?: boolean;
  controls_weight?: boolean;
}

export interface AddProductAttributeInputDto {
  attribute_id: number;
  controls_pricing: boolean;
  controls_media: boolean;
  controls_weight: boolean;
}

// Pricing Management
export interface UpdateSinglePricingDto {
  cost?: number;
  price?: number;
  sale_price?: number;
}

export interface UpdateVariantPricingDto {
  combination: Record<string, number>;
  cost?: number;
  price?: number;
  sale_price?: number;
}

// Weight Management
export interface UpdateWeightDto {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface UpdateVariantWeightDto {
  combination: Record<string, number>;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

// Stock Management
export interface UpdateStockInputDto {
  combination: Record<string, number>;
  stock_quantity: number;
}

// Main Update DTO
export interface UpdateProductDto {
  // Basic Information
  name_en?: string;
  name_ar?: string;
  sku?: string;
  short_description_en?: string;
  short_description_ar?: string;
  long_description_en?: string;
  long_description_ar?: string;
  pricing_type?: 'single' | 'variant';
  category_id?: number;
  vendor_id?: number;
  is_active?: boolean;

  // Media Management
  media_management?: MediaManagementDto;

  // Attributes
  add_attributes?: AddProductAttributeInputDto[];
  update_attributes?: UpdateProductAttributeInputDto[];
  delete_attribute_ids?: number[];

  // Pricing
  single_pricing?: UpdateSinglePricingDto;
  variant_pricing?: UpdateVariantPricingDto[];

  // Weight
  product_weight?: UpdateWeightDto;
  variant_weights?: UpdateVariantWeightDto[];

  // Stock
  stock?: UpdateStockInputDto[];
}

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
  async getProduct(id: string | number): Promise<ApiResponse<ProductDetail>> {
    return httpClient.get<ApiResponse<ProductDetail>>(`${this.endpoint}/${id}`);
  }


  /**
   * Create  product with all variant data in one request
   */
  async createProduct(
    data: CreateProductDto
  ): Promise<ApiResponse<{ product: Product }>> {
    return httpClient.post<ApiResponse<{ product: Product }>>(
      `${this.endpoint}`,
      data
    );
  }

  /**
   * Create  product with files (FormData)
   */
  async createProductWithFiles(
    formData: FormData
  ): Promise<ApiResponse<Product>> {
    return httpClient.postFormData<ApiResponse<Product>>(
      `${this.endpoint}/`,
      formData
    );
  }

  /**
   * Update a product (PATCH - partial update)
   */
  async updateProduct(
    id: string | number,
    data: UpdateProductDto
  ): Promise<ApiResponse<Product>> {
    return this.patch(id, data);
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
    is_active: boolean
  ): Promise<ApiResponse<Product>> {
    return this.patch(id, { is_active });
  }

  // ============================================
  // Product Attributes Management
  // ============================================

  /**
   * Add attributes to product
   */
  async addProductAttributes(
    productId: number,
    data: AddProductAttributesDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/attributes`, data);
  }

  /**
   * Get product attributes
   */
  async getProductAttributes(productId: number): Promise<ApiResponse<any>> {
    return httpClient.get(`${this.endpoint}/${productId}/attributes`);
  }

  /**
   * Update product attribute
   */
  async updateProductAttribute(
    attributeId: number,
    data: Partial<ProductAttributeDto>
  ): Promise<ApiResponse<any>> {
    return httpClient.patch(`${this.endpoint}/attributes/${attributeId}`, data);
  }

  /**
   * Remove product attribute
   */
  async removeProductAttribute(attributeId: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`${this.endpoint}/attributes/${attributeId}`);
  }

  // ============================================
  // Product Pricing Management
  // ============================================

  /**
   * Set single pricing
   */
  async setSinglePricing(
    productId: number,
    data: SinglePricingDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/pricing`, data);
  }

  /**
   * Set variant pricing
   */
  async setVariantPricing(
    productId: number,
    data: VariantPricingDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/variant-pricing`, data);
  }

  /**
   * Get product pricing
   */
  async getProductPricing(productId: number): Promise<ApiResponse<any>> {
    return httpClient.get(`${this.endpoint}/${productId}/pricing`);
  }

  /**
   * Get variant pricing
   */
  async getVariantPricing(productId: number): Promise<ApiResponse<any[]>> {
    return httpClient.get(`${this.endpoint}/${productId}/variant-pricing`);
  }

  // ============================================
  // Product Media Management
  // ============================================

  /**
   * Add product media
   */
  async addProductMedia(
    productId: number,
    data: ProductMediaDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/media`, data);
  }

  /**
   * Upload product media file
   */
  async uploadProductMedia(
    productId: number,
    file: File,
    type: 'image' | 'video',
    sortOrder?: number,
    isPrimary?: boolean
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (sortOrder !== undefined) formData.append('sort_order', sortOrder.toString());
    if (isPrimary !== undefined) formData.append('is_primary', isPrimary.toString());
    
    return httpClient.postFormData(`${this.endpoint}/${productId}/media`, formData);
  }

  /**
   * Add variant media
   */
  async addVariantMedia(
    productId: number,
    data: VariantMediaDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/variant-media`, data);
  }

  /**
   * Upload variant media file
   */
  async uploadVariantMedia(
    productId: number,
    attributeValueId: number,
    file: File,
    type: 'image' | 'video',
    sortOrder?: number,
    isPrimary?: boolean
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attribute_value_id', attributeValueId.toString());
    formData.append('type', type);
    if (sortOrder !== undefined) formData.append('sort_order', sortOrder.toString());
    if (isPrimary !== undefined) formData.append('is_primary', isPrimary.toString());
    
    return httpClient.postFormData(`${this.endpoint}/${productId}/variant-media`, formData);
  }

  /**
   * Get product media
   */
  async getProductMedia(productId: number): Promise<ApiResponse<any>> {
    return httpClient.get(`${this.endpoint}/${productId}/media`);
  }

  /**
   * Set primary media
   */
  async setPrimaryMedia(
    mediaId: number,
    isVariant: boolean
  ): Promise<ApiResponse<any>> {
    return httpClient.patch(`${this.endpoint}/media/${mediaId}/primary`, {
      is_variant: isVariant,
    });
  }

  /**
   * Delete media
   */
  async deleteMedia(
    mediaId: number,
    isVariant: boolean
  ): Promise<ApiResponse<void>> {
    return httpClient.delete(
      `${this.endpoint}/media/${mediaId}?is_variant=${isVariant}`
    );
  }

  // ============================================
  // Product Weight Management
  // ============================================

  /**
   * Set product weight
   */
  async setProductWeight(
    productId: number,
    data: ProductWeightDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/weight`, data);
  }

  /**
   * Set variant weight
   */
  async setVariantWeight(
    productId: number,
    data: VariantWeightDto
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`${this.endpoint}/${productId}/variant-weight`, data);
  }

  /**
   * Get product weight
   */
  async getProductWeight(productId: number): Promise<ApiResponse<any>> {
    return httpClient.get(`${this.endpoint}/${productId}/weight`);
  }

  /**
   * Get variant weights
   */
  async getVariantWeights(productId: number): Promise<ApiResponse<any[]>> {
    return httpClient.get(`${this.endpoint}/${productId}/variant-weights`);
  }

  // ============================================
  // Product Stock Management
  // ============================================

  /**
   * Get product stock
   */
  async getProductStock(productId: number): Promise<ApiResponse<any[]>> {
    return httpClient.get(`${this.endpoint}/${productId}/stock`);
  }

  /**
   * Update stock quantity
   */
  async updateStockQuantity(
    stockId: number,
    data: UpdateStockDto
  ): Promise<ApiResponse<any>> {
    return httpClient.patch(`${this.endpoint}/stock/${stockId}`, data);
  }
}

export const productService = new ProductService();

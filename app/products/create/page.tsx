/**
 * Create Product Page
 * Page for creating new products with single-page form
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../src/services/vendors/hooks/use-vendors";
import { useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { productService } from "../../src/services/products/api/product.service";
import { transformFormDataToDto } from "../../src/services/products/form/transform";
import { queryKeys } from "../../src/lib/query-keys";

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors();
  const { data: attributesData, isLoading: attributesLoading } = useAttributes();

  // Transform backend data to frontend format
  const categories = categoriesData?.map(cat => ({
    id: cat.id.toString(),
    name: cat.name,
  })) || [];

  const vendors = vendorsData?.map(vendor => ({
    id: vendor.id.toString(),
    name: vendor.name,
  })) || [];

  const attributes = attributesData?.map(attr => ({
    id: attr.id.toString(),
    name: attr.name_en,
    displayName: attr.name_ar,
    values: attr.values?.map(val => ({
      id: val.id.toString(),
      value: val.value_en,
      displayValue: val.value_ar,
    })) || [],
  })) || [];

  const handleSubmit = async (data: ProductFormData) => {
    try {
      
      // Transform form data to DTO and extract media
      const { dto, mediaData } = transformFormDataToDto(data);
            
      // Step 1: Create  product without media
      const response = await productService.createProduct(dto);
            
      // Extract product ID from response
      const productId = response.data?.product.id;
      
      if (!productId) {
        console.error("Could not extract product ID from response:", response);
        throw new Error("Product created but ID not found in response");
      }
      
      
      // Step 2: Upload media files separately
      if (mediaData.singleMedia && mediaData.singleMedia.length > 0) {
        for (const media of mediaData.singleMedia) {
          // Only upload new media files (skip existing media with null file)
          if (media.file) {
            await productService.uploadProductMedia(
              productId,
              media.file,
              media.type,
              media.order,
              media.isPrimary
            );
          }
        }
      }

      if (mediaData.variantMedia && mediaData.variantMedia.length > 0) {
        for (const variantMedia of mediaData.variantMedia) {
          // Get the first attribute value ID for the combination
          // Note: Backend expects attribute_value_id, might need adjustment based on your variant structure
          const attributeValueId = parseInt(Object.values(variantMedia.attributeValues)[0]);
          
          for (const media of variantMedia.media) {
            // Only upload new media files (skip existing media with null file)
            if (media.file) {
              await productService.uploadVariantMedia(
                productId,
                attributeValueId,
                media.file,
                media.type,
                media.order,
                media.isPrimary
              );
            }
          }
        }
      }
      
      // Invalidate products list query to refetch data
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      
      alert("Product created successfully!");
      router.push("/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      alert(error?.message || "Failed to create product");
    }
  };

  const handleSaveDraft = async (data: Partial<ProductFormData>) => {
    try {
      // TODO: Implement draft saving functionality
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
    }
  };

  if (categoriesLoading || vendorsLoading || attributesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sixth mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
      attributes={attributes}
    />
  );
}

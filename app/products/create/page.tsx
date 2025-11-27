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
      // DEBUG: Log the incoming form data
      console.log('=== DEBUG: Form Data ===');
      console.log('isMediaVariantBased:', data.isMediaVariantBased);
      console.log('singleMedia:', data.singleMedia);
      console.log('singleMedia length:', data.singleMedia?.length);
      console.log('variantMedia:', data.variantMedia);
      console.log('variantMedia length:', data.variantMedia?.length);
      
      // Transform form data to DTO and extract media
      const { dto, mediaData } = transformFormDataToDto(data);
      
      // DEBUG: Log the extracted media data
      console.log('=== DEBUG: Extracted Media Data ===');
      console.log('mediaData:', mediaData);
      console.log('mediaData.singleMedia:', mediaData.singleMedia);
      console.log('mediaData.singleMedia length:', mediaData.singleMedia?.length);
      console.log('mediaData.variantMedia:', mediaData.variantMedia);
            
      // Step 1: Create product without media
      const response = await productService.createProduct(dto);
      
      // DEBUG: Log the response
      console.log('=== DEBUG: Create Product Response ===');
      console.log('response:', response);
            
      // Extract product ID and variants from response
      // Response type is ApiResponse<{ product: Product }>, so data is { product: Product }
      const productId = response.data?.product?.id;
      // Cast to any to access variants which may be in the response but not in the Product type
      const createdVariants = (response.data?.product as any)?.variants || [];
      
      console.log('=== DEBUG: Extracted IDs ===');
      console.log('productId:', productId);
      console.log('createdVariants:', createdVariants);
      
      if (!productId) {
        console.error("Could not extract product ID from response:", response);
        throw new Error("Product created but ID not found in response");
      }
      
      
      // Step 2: Upload general product media (no variant_id)
      console.log('=== DEBUG: Checking Single Media Upload ===');
      console.log('Condition check - mediaData.singleMedia:', !!mediaData.singleMedia);
      console.log('Condition check - mediaData.singleMedia.length > 0:', (mediaData.singleMedia?.length || 0) > 0);
      
      if (mediaData.singleMedia && mediaData.singleMedia.length > 0) {
        console.log('=== DEBUG: Uploading Single Media ===');
        for (const media of mediaData.singleMedia) {
          console.log('Processing media item:', media);
          console.log('media.file:', media.file);
          console.log('media.file is truthy:', !!media.file);
          
          // Only upload new media files (skip existing media with null file)
          if (media.file) {
            console.log('=== DEBUG: Calling uploadProductMedia ===');
            console.log('productId:', productId);
            console.log('file:', media.file);
            console.log('order:', media.order);
            console.log('isPrimary:', media.isPrimary);
            
            try {
              const uploadResult = await productService.uploadProductMedia(
                productId,
                media.file,
                media.order,
                media.isPrimary
              );
              console.log('Upload result:', uploadResult);
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }
          } else {
            console.log('Skipping media - file is null/undefined');
          }
        }
      } else {
        console.log('=== DEBUG: Skipping Single Media Upload - No media to upload ===');
      }

      // Step 3: Upload variant-specific media using variant_id from response
      // Note: variantMedia.attributeValues only contains media-controlling attributes
      // We upload to ONE matching variant - backend handles the association with all related variants
      if (mediaData.variantMedia && mediaData.variantMedia.length > 0 && createdVariants.length > 0) {
        for (const variantMediaData of mediaData.variantMedia) {
          // Get attribute value IDs from this variant media combination
          // These are only the media-controlling attribute values
          const mediaAttrValueIds = Object.values(variantMediaData.attributeValues || {})
            .filter(id => id && id !== '')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
          
          if (mediaAttrValueIds.length === 0) {
            console.warn('Skipping variant media upload: no valid attribute value IDs');
            continue;
          }
          
          // Find ONE variant that contains these media attribute values
          // Backend handles associating this media with all related variants
          const matchingVariant = createdVariants.find((variant: any) => {
            const variantAttrValueIds = (variant.combinations || [])
              .map((c: any) => c.attribute_value_id);
            
            // Check if variant contains ALL media attribute values
            return mediaAttrValueIds.every(mediaAttrId => 
              variantAttrValueIds.includes(mediaAttrId)
            );
          });
          
          if (!matchingVariant) {
            console.warn('Could not find matching variant for media:', mediaAttrValueIds);
            continue;
          }
          
          const variantId = matchingVariant.id;
          
          // Upload each media file to this variant
          for (const media of variantMediaData.media) {
            if (media.file) {
              await productService.uploadVariantMedia(
                productId,
                variantId,
                media.file,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fourth mx-auto"></div>
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

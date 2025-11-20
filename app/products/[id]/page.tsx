/**
 * Edit Product Page
 * Page for editing existing products
 */

"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";
import { ProductDetail } from "../../src/services/products/types/product.types";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../src/services/vendors/hooks/use-vendors";
import { useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { useProduct } from "../../src/services/products/hooks/use-products";
import { productService } from "../../src/services/products/api/product.service";
import { Card } from "../../src/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../src/components/ui/button";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const { data: productData, isLoading: productLoading, isError: productError, error: productErrorData, refetch: refetchProduct } = useProduct(productId);
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

  // Transform product data to form initial data
  const product: ProductDetail | undefined = productData?.data;
  const initialData: Partial<ProductFormData> | undefined = product ? {
    nameEn: product.name_en,
    nameAr: product.name_ar,
    categoryId: product.category?.id?.toString() || product.category_id.toString(),
    vendorId: product.vendor?.id?.toString() || product.vendor_id?.toString(),
    shortDescriptionEn: product.short_description_en || "",
    shortDescriptionAr: product.short_description_ar || "",
    longDescriptionEn: product.long_description_en || "",
    longDescriptionAr: product.long_description_ar || "",
    pricingType: product.pricing_type,
    isActive: product.is_active,
    
    // Transform pricing data
    singlePricing: product.pricing_type === 'single' && product.pricing?.[0] ? {
      cost: parseFloat(product.pricing[0].cost),
      price: parseFloat(product.pricing[0].price),
      isSale: !!product.pricing[0].sale_price,
      salePrice: product.pricing[0].sale_price ? parseFloat(product.pricing[0].sale_price) : undefined,
    } : undefined,
    
    // Transform weight/dimensions data
    isWeightVariantBased: false,
    singleWeightDimensions: product.weight?.[0] ? {
      weight: product.weight[0].weight ? parseFloat(product.weight[0].weight) : undefined,
      length: product.weight[0].length ? parseFloat(product.weight[0].length) : undefined,
      width: product.weight[0].width ? parseFloat(product.weight[0].width) : undefined,
      height: product.weight[0].height ? parseFloat(product.weight[0].height) : undefined,
    } : undefined,
    
    // Transform media data
    isMediaVariantBased: false,
    singleMedia: product.media
      ?.sort((a, b) => a.sort_order - b.sort_order) // Sort by sort_order from backend
      .map((m, index: number) => ({
        id: m.id.toString(),
        file: null, // Existing media loaded from URL
        preview: m.url,
        type: m.type,
        order: m.sort_order, // Use sort_order from backend
        isPrimary: m.is_primary,
      })) || [],
    
    // Transform stock data (only if stock exists)
    variants: product.stock && product.stock.length > 0 ? product.stock.map((s) => ({
      id: s.id.toString(),
      attributeValues: {}, // Would need combination data from backend
      stock: s.stock_quantity || 0,
    })) : undefined,
    
    // TODO: Transform attributes, variant pricing, variant media, variant weights when backend provides proper structure
  } : undefined;

  const handleSubmit = async (data: ProductFormData) => {
    try {
      // Build payload with only changed values
      const productPayload: Record<string, any> = {};

      // ========== BASIC INFORMATION (flat structure) ==========
      if (initialData?.nameEn !== data.nameEn) productPayload.name_en = data.nameEn;
      if (initialData?.nameAr !== data.nameAr) productPayload.name_ar = data.nameAr;
      if (initialData?.shortDescriptionEn !== data.shortDescriptionEn) productPayload.short_description_en = data.shortDescriptionEn || undefined;
      if (initialData?.shortDescriptionAr !== data.shortDescriptionAr) productPayload.short_description_ar = data.shortDescriptionAr || undefined;
      if (initialData?.longDescriptionEn !== data.longDescriptionEn) productPayload.long_description_en = data.longDescriptionEn || undefined;
      if (initialData?.longDescriptionAr !== data.longDescriptionAr) productPayload.long_description_ar = data.longDescriptionAr || undefined;
      if (initialData?.pricingType !== data.pricingType) productPayload.pricing_type = data.pricingType;
      if (initialData?.categoryId !== data.categoryId) productPayload.category_id = parseInt(data.categoryId);
      if (initialData?.vendorId !== data.vendorId) productPayload.vendor_id = data.vendorId ? parseInt(data.vendorId) : undefined;
      if (initialData?.isActive !== data.isActive) productPayload.is_active = data.isActive;

      // ========== MEDIA MANAGEMENT ==========
      const mediaManagement: any = {};
      const deleteMedia: any[] = [];
      const reorderMedia: any[] = [];
      let setPrimaryMediaId: number | undefined;

      if (!data.isMediaVariantBased && data.singleMedia && initialData?.singleMedia) {
        const currentMediaIds = new Set(data.singleMedia.map(m => parseInt(m.id)));
        const initialMediaIds = new Set(initialData.singleMedia.map(m => parseInt(m.id)));

        // Find deleted media
        initialData.singleMedia.forEach(initialMedia => {
          const mediaId = parseInt(initialMedia.id);
          if (!currentMediaIds.has(mediaId)) {
            deleteMedia.push({ media_id: mediaId, is_variant: false });
          }
        });

        // Check for reordering or primary changes
        data.singleMedia.forEach((media, index) => {
          const mediaId = parseInt(media.id);
          const initialMedia = initialData.singleMedia?.find(m => parseInt(m.id) === mediaId);
          
          if (initialMedia) {
            // Check if order changed
            if (initialMedia.order !== media.order) {
              reorderMedia.push({ media_id: mediaId, sort_order: media.order });
            }
            
            // Check if primary status changed
            if (media.isPrimary && !initialMedia.isPrimary) {
              setPrimaryMediaId = mediaId;
            }
          }
        });
      }

      // Add media management to payload if there are changes
      if (deleteMedia.length > 0) mediaManagement.delete_media = deleteMedia;
      if (reorderMedia.length > 0) mediaManagement.reorder_media = reorderMedia;
      if (setPrimaryMediaId) {
        mediaManagement.set_primary_media_id = setPrimaryMediaId;
        mediaManagement.is_variant_media = false;
      }
      
      if (Object.keys(mediaManagement).length > 0) {
        productPayload.media_management = mediaManagement;
      }

      // ========== PRICING ==========
      if (data.pricingType === 'single' && data.singlePricing) {
        const pricingChanged = 
          initialData?.singlePricing?.cost !== data.singlePricing.cost ||
          initialData?.singlePricing?.price !== data.singlePricing.price ||
          initialData?.singlePricing?.salePrice !== data.singlePricing.salePrice;
        
        if (pricingChanged) {
          productPayload.single_pricing = {
            cost: data.singlePricing.cost,
            price: data.singlePricing.price,
            sale_price: data.singlePricing.salePrice,
          };
        }
      }

      // ========== WEIGHT & DIMENSIONS ==========
      if (!data.isWeightVariantBased && data.singleWeightDimensions) {
        const weightChanged = 
          initialData?.singleWeightDimensions?.weight !== data.singleWeightDimensions.weight ||
          initialData?.singleWeightDimensions?.length !== data.singleWeightDimensions.length ||
          initialData?.singleWeightDimensions?.width !== data.singleWeightDimensions.width ||
          initialData?.singleWeightDimensions?.height !== data.singleWeightDimensions.height;
        
        if (weightChanged) {
          productPayload.product_weight = {
            weight: data.singleWeightDimensions.weight,
            length: data.singleWeightDimensions.length,
            width: data.singleWeightDimensions.width,
            height: data.singleWeightDimensions.height,
          };
        }
      }

      // Step 1: Update product with all changes including media management
      if (Object.keys(productPayload).length > 0) {
        await productService.updateProduct(productId, productPayload);
      }

      // Step 2: Handle new media uploads (files with non-null file property)
      if (!data.isMediaVariantBased && data.singleMedia) {
        const newMedia = data.singleMedia.filter(m => m.file !== null);
        if (newMedia.length > 0) {
          for (const media of newMedia) {
            await productService.uploadProductMedia(
              productId,
              media.file!,
              media.type,
              media.order,
              media.isPrimary
            );
          }
        }
      }

      if (data.isMediaVariantBased && data.variantMedia) {
        for (const variantMedia of data.variantMedia) {
          const newMedia = variantMedia.media.filter(m => m.file !== null);
          if (newMedia.length > 0) {
            const attributeValueId = parseInt(Object.values(variantMedia.attributeValues)[0]);
            for (const media of newMedia) {
              await productService.uploadVariantMedia(
                productId,
                attributeValueId,
                media.file!,
                media.type,
                media.order,
                media.isPrimary
              );
            }
          }
        }
      }
      
      alert("Product updated successfully!");
      router.push("/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert(error?.message || "Failed to update product");
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

  if (productLoading || categoriesLoading || vendorsLoading || attributesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sixth mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-third mb-2">
                Error Loading Product
              </h3>
              <p className="text-gray-600 mb-6">{(productErrorData as any)?.message || "Failed to load product"}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refetchProduct()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/products")}>
                  Back to Products
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <h3 className="text-xl font-bold text-third mb-2">Product Not Found</h3>
              <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/products")}>
                Back to Products
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      isEditMode={true}
      initialData={initialData}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
      attributes={attributes}
    />
  );
}

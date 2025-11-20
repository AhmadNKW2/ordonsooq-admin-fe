/**
 * Edit Product Page
 * Page for editing existing products with single-page form
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ProductFormData>>();

  // Mock categories - replace with actual API call
  const categories = [
    { id: "1", name: "Electronics" },
    { id: "2", name: "Clothing" },
    { id: "3", name: "Home & Garden" },
    { id: "4", name: "Sports" },
  ];

  // Mock vendors - replace with actual API call
  const vendors = [
    { id: "1", name: "Tech Supplies Co." },
    { id: "2", name: "Fashion Hub" },
    { id: "3", name: "Home Essentials" },
    { id: "4", name: "Sports World" },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // TODO: Call API to fetch product
        // const product = await productService.getProduct(productId);
        
        // Mock data for demonstration
        const mockData: Partial<ProductFormData> = {
          nameEn: "Sample Product",
          nameAr: "منتج عينة",
          categoryId: "1",
          shortDescriptionEn: "A great product",
          shortDescriptionAr: "منتج رائع",
          longDescriptionEn: "This is a detailed description",
          longDescriptionAr: "هذا وصف مفصل",
          pricingType: "single",
          isActive: true,
          singlePricing: {
            cost: 50,
            price: 100,
            salePrice: 80,
          },
          attributes: [],
          singleMedia: [],
          variants: [],
        };
        
        setInitialData(mockData);
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      console.log("Updating product:", data);
      // TODO: Call API to update product
      // await productService.updateProduct(productId, data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Product updated successfully!");
      router.push("/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const handleSaveDraft = async (data: Partial<ProductFormData>) => {
    try {
      console.log("Saving draft:", data);
      // TODO: Call API to save draft
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sixth border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      initialData={initialData}
      isEditMode={true}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
    />
  );
}

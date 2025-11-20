/**
 * Create Product Page
 * Page for creating new products with single-page form
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";

export default function CreateProductPage() {
  const router = useRouter();

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

  const handleSubmit = async (data: ProductFormData) => {
    try {
      console.log("Submitting product:", data);
      // TODO: Call API to create product
      // await productService.createProduct(data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Product created successfully!");
      router.push("/products");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
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

  return (
    <ProductForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
    />
  );
}

"use client";

import { ProductListPage } from "../../src/components/products/ProductListPage";

export default function ReviewProductsPage() {
  return (
    <ProductListPage
      title="Products Review"
      description="Manage products whose status is review"
      storageKey="products_review"
      fixedStatus="review"
    />
  );
}
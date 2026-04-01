"use client";

import { ProductListPage } from "../src/components/products/ProductListPage";

export default function ProductsPage() {
  return (
    <ProductListPage
      title="Products"
      description="Manage your product inventory"
      storageKey="products"
    />
  );
}






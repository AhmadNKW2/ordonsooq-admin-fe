"use client";

import { ProductListPage } from "../../src/components/products/ProductListPage";

export default function UpdatedProductsPage() {
  return (
    <ProductListPage
      title="Updated Products"
      description="Manage products whose status is updated"
      storageKey="products_updated"
      fixedStatus="updated"
    />
  );
}
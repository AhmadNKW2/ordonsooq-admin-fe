/**
 * Products Feature - Public API
 * Export all public components, hooks, and types
 */

// Hooks
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
} from "./hooks/use-products";

// Types
export type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
} from "./types/product.types";

// Services
export { productService } from "./api/product.service";

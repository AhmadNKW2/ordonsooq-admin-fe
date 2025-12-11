/**
 * Query Keys Factory - Centralized query key management
 * Following the Factory pattern
 */

export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.details(), id] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.orders.details(), id] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    tree: ["categories", "tree"] as const,
    main: ["categories", "main"] as const,
    archived: ["categories", "archived"] as const,
    products: (id: number) => ["categories", id, "products"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.categories.lists(), params] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.categories.details(), id] as const,
  },

  // Vendors
  vendors: {
    all: ["vendors"] as const,
    archived: ["vendors", "archived"] as const,
    products: (id: number) => ["vendors", id, "products"] as const,
    lists: () => [...queryKeys.vendors.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.vendors.lists(), params] as const,
    details: () => [...queryKeys.vendors.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.vendors.details(), id] as const,
  },

  // Brands
  brands: {
    all: ["brands"] as const,
    archived: ["brands", "archived"] as const,
    products: (id: number) => ["brands", id, "products"] as const,
    lists: () => [...queryKeys.brands.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.brands.lists(), params] as const,
    details: () => [...queryKeys.brands.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.brands.details(), id] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    archived: ["products", "archived"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.products.details(), id] as const,
  },

  // Attributes
  attributes: {
    all: ["attributes"] as const,
    lists: () => [...queryKeys.attributes.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.attributes.lists(), params] as const,
    details: () => [...queryKeys.attributes.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.attributes.details(), id] as const,
  },

  // Wishlists
  wishlists: {
    all: ["wishlists"] as const,
    lists: () => [...queryKeys.wishlists.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.wishlists.lists(), params] as const,
    details: () => [...queryKeys.wishlists.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.wishlists.details(), id] as const,
  },

  // Customers
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.customers.lists(), params] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.customers.details(), id] as const,
  },
} as const;

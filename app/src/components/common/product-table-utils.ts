import type { Product } from "../../services/products/types/product.types";

type PriceCandidate = {
  raw: string;
  numericValue: number;
};

type MediaItemLike = {
  url?: string | null;
  image?: { url?: string | null } | null;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
};

type VariantLike = {
  media?: { url?: string | null } | null;
  quantity?: number | null;
  is_out_of_stock?: boolean | null;
};

export interface ProductItem {
  id: number;
  name_en: string;
  name_ar: string;
  sku?: string | null;
  slug?: string | null;
  primary_image?: { url: string; alt_text?: string | null } | null;
  image?: string | null;
  media?: MediaItemLike[] | null;
  media_groups?: Record<string, any>;
  price_groups?: Record<string, any>;
  variants?: VariantLike[] | null;
  price?: string | number | any[] | Record<string, any> | null;
  sale_price?: string | number | null;
  category?: { name?: string; name_en?: string } | null;
  categories?: Array<{ id?: number; name?: string; name_en?: string }>;
  vendor?: { name?: string; name_en?: string; logo?: string | null } | null;
  brand?: { name_en?: string; logo?: string | null } | null;
  visible?: boolean;
  is_active?: boolean;
  quantity?: number | null;
  is_out_of_stock?: boolean | null;
  average_rating?: number | string | null;
  total_ratings?: number | null;
}

const formatPriceValue = (value: number) => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toPriceCandidate = (value: unknown): PriceCandidate | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return {
    raw: formatPriceValue(numericValue),
    numericValue,
  };
};

const getMediaUrl = (mediaItem?: MediaItemLike | null) => {
  if (!mediaItem) {
    return null;
  }

  return mediaItem.url || mediaItem.image?.url || null;
};

export const mapProductToProductItem = (
  product: Partial<Product> & Record<string, any>
): ProductItem => ({
  id: Number(product.id),
  name_en: product.name_en || "",
  name_ar: product.name_ar || "",
  sku: product.sku ?? null,
  slug: product.slug ?? null,
  primary_image: product.primary_image ?? null,
  image: typeof product.image === "string" ? product.image : null,
  media: Array.isArray(product.media) ? product.media : null,
  media_groups: product.media_groups,
  price_groups: product.price_groups,
  variants: Array.isArray(product.variants) ? product.variants : null,
  price: product.price ?? null,
  sale_price: product.sale_price ?? null,
  category: product.category
    ? { name: product.category.name, name_en: product.category.name_en }
    : null,
  categories: Array.isArray(product.categories)
    ? product.categories.map((category: any) => ({
        id: category?.id,
        name: category?.name,
        name_en: category?.name_en,
      }))
    : undefined,
  vendor: product.vendor
    ? {
        name: product.vendor.name,
        name_en: product.vendor.name_en,
        logo: product.vendor.logo ?? null,
      }
    : null,
  brand: product.brand
    ? {
        name_en: product.brand.name_en,
        logo: product.brand.logo ?? null,
      }
    : null,
  visible: typeof product.visible === "boolean" ? product.visible : undefined,
  is_active: typeof product.is_active === "boolean" ? product.is_active : undefined,
  quantity: typeof product.quantity === "number" ? product.quantity : null,
  is_out_of_stock:
    typeof product.is_out_of_stock === "boolean" ? product.is_out_of_stock : null,
  average_rating: product.average_rating ?? null,
  total_ratings:
    typeof product.total_ratings === "number" ? product.total_ratings : null,
});

export const getProductImageUrl = (product: ProductItem | (Product & Record<string, any>)) => {
  if (product.primary_image?.url) {
    return product.primary_image.url;
  }

  if (typeof product.image === "string" && product.image.trim()) {
    return product.image;
  }

  const directMedia = Array.isArray(product.media) ? product.media : [];
  const primaryDirectMedia = directMedia.find((mediaItem) => mediaItem?.is_primary);
  const primaryDirectMediaUrl = getMediaUrl(primaryDirectMedia);
  if (primaryDirectMediaUrl) {
    return primaryDirectMediaUrl;
  }

  const firstDirectMedia = [...directMedia]
    .sort((left, right) => (left?.sort_order ?? 0) - (right?.sort_order ?? 0))
    .find((mediaItem) => getMediaUrl(mediaItem));
  const firstDirectMediaUrl = getMediaUrl(firstDirectMedia);
  if (firstDirectMediaUrl) {
    return firstDirectMediaUrl;
  }

  if (product.variants?.length) {
    const variantImageUrl = product.variants.find((variant) => variant?.media?.url)?.media?.url;
    if (variantImageUrl) {
      return variantImageUrl;
    }
  }

  if (product.media_groups) {
    for (const key of Object.keys(product.media_groups)) {
      const group = product.media_groups[key];
      if (group?.media?.length) {
        const primaryMedia = group.media.find((mediaItem: MediaItemLike) => mediaItem?.is_primary);
        const primaryMediaUrl = getMediaUrl(primaryMedia);
        if (primaryMediaUrl) {
          return primaryMediaUrl;
        }

        const firstGroupMediaUrl = getMediaUrl(group.media[0]);
        if (firstGroupMediaUrl) {
          return firstGroupMediaUrl;
        }
      }
    }
  }

  return null;
};

export const getProductDisplayPrice = (product: ProductItem | (Product & Record<string, any>)) => {
  let basePrice = null;
  let salePrice = null;

  if (product.variants?.length && product.price_groups) {
    const firstVariant = product.variants[0] as Record<string, any>;
    const priceGroup = product.price_groups[firstVariant.price_group_id];
    if (priceGroup) {
      basePrice = toPriceCandidate(priceGroup.price);
      salePrice = toPriceCandidate(priceGroup.sale_price);
    }
  } else if (product.price_groups) {
    const firstGroup = product.price_groups[Object.keys(product.price_groups)[0]];
    if (firstGroup) {
      basePrice = toPriceCandidate(firstGroup.price);
      salePrice = toPriceCandidate(firstGroup.sale_price);
    }
  } else if (product.price) {
    const legacyPrice = product.price as any;
    if (typeof legacyPrice === "object" && !Array.isArray(legacyPrice)) {
      basePrice = toPriceCandidate(legacyPrice.price);
      salePrice = toPriceCandidate(legacyPrice.sale_price);
    } else if (Array.isArray(legacyPrice)) {
      const firstPrice = legacyPrice[0];
      if (typeof firstPrice === "object") {
        basePrice = toPriceCandidate(firstPrice.price);
        salePrice = toPriceCandidate(firstPrice.sale_price);
      } else {
        basePrice = toPriceCandidate(firstPrice);
        salePrice = toPriceCandidate(product.sale_price);
      }
    } else {
      basePrice = toPriceCandidate(legacyPrice);
      salePrice = toPriceCandidate(product.sale_price);
    }
  } else {
    salePrice = toPriceCandidate(product.sale_price);
  }

  if (basePrice && salePrice && basePrice.numericValue !== salePrice.numericValue) {
    const currentPrice = basePrice.numericValue <= salePrice.numericValue ? basePrice : salePrice;
    const compareAtPrice =
      basePrice.numericValue <= salePrice.numericValue ? salePrice : basePrice;

    return {
      currentPrice: currentPrice.raw,
      compareAtPrice: compareAtPrice.raw,
    };
  }

  const currentPrice = basePrice || salePrice;
  if (!currentPrice) {
    return null;
  }

  return {
    currentPrice: currentPrice.raw,
    compareAtPrice: null,
  };
};

export const getProductCategoryName = (product: ProductItem) => {
  return (
    product.categories?.[0]?.name_en ||
    product.categories?.[0]?.name ||
    product.category?.name_en ||
    product.category?.name ||
    null
  );
};

export const formatProductCategoryName = (name?: string | null) => {
  if (!name) {
    return "";
  }

  const words = name.trim().split(/\s+/);
  if (words.length <= 1) {
    return name;
  }

  return `${words[0]} ${words[1].slice(0, 3)}...`;
};

export const formatProductRating = (rating?: number | string | null) => {
  if (!rating) {
    return "0.0";
  }

  const numericRating = typeof rating === "number" ? rating : parseFloat(rating);
  return Number.isFinite(numericRating) ? numericRating.toFixed(1) : "0.0";
};

export const getProductStockSummary = (product: ProductItem) => {
  if (product.variants?.length) {
    const totalQuantity = product.variants.reduce((sum, variant) => {
      return sum + (variant?.quantity ?? 0);
    }, 0);
    const everyVariantOutOfStock = product.variants.every(
      (variant) => variant?.is_out_of_stock === true
    );
    const inStock = totalQuantity > 0 && !everyVariantOutOfStock;

    return {
      inStock,
      label: inStock ? `${totalQuantity} in stock` : "Out of stock",
    };
  }

  if (typeof product.quantity === "number") {
    const inStock = product.quantity > 0 && product.is_out_of_stock !== true;
    return {
      inStock,
      label: inStock ? `${product.quantity} in stock` : "Out of stock",
    };
  }

  const inStock = product.is_out_of_stock === false;
  return {
    inStock,
    label: inStock ? "In stock" : "Out of stock",
  };
};
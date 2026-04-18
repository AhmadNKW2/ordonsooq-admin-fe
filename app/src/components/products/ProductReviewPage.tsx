"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ExternalLink,
  ImageOff,
  Loader2,
  Package,
  PencilLine,
  RefreshCw,
  Shield,
  Sparkles,
  Store,
  Tag,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { CategoryTreeSelect } from "@/components/products/CategoryTreeSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useSessionStoragePage } from "@/hooks/use-session-storage-page";
import { useLoading } from "@/providers/loading-provider";
import { useCategories } from "@/services/categories/hooks/use-categories";
import {
  usePermanentDeleteProduct,
  useProducts,
  useUpdateProductWorkflowStatus,
} from "@/services/products/hooks/use-products";
import { Product, ProductFilters } from "@/services/products/types/product.types";
import { useVendors } from "@/services/vendors/hooks/use-vendors";

type ProductLike = Product & Record<string, any>;

type PriceSummary = {
  currentPrice: string;
  compareAtPrice: string | null;
};

type ProductChip = {
  label: string;
  colorCode?: string | null;
};

type ProductGroup = {
  label: string;
  values: ProductChip[];
};

type ReviewSnapshot = {
  imageUrl: string | null;
  displayPrice: PriceSummary | null;
  visible: boolean;
  outOfStock: boolean;
  previewUrl: string | null;
  referenceUrl: string | null;
  attributes: ProductGroup[];
  specifications: ProductGroup[];
};

type QueueItem = {
  product: Product;
  snapshot: ReviewSnapshot;
};

const REVIEW_STORAGE_KEY = "products_review";
const REVIEW_FILTERS_STORAGE_KEY = `${REVIEW_STORAGE_KEY}_filters`;

const formatPriceValue = (value: number) => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toPriceCandidate = (value: unknown) => {
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

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getDisplayText = (...candidates: unknown[]) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return null;
};

const dedupeChips = (chips: ProductChip[]) => {
  const unique = new Map<string, ProductChip>();

  chips.forEach((chip) => {
    const key = `${chip.label}|${chip.colorCode ?? ""}`;
    if (!unique.has(key)) {
      unique.set(key, chip);
    }
  });

  return Array.from(unique.values());
};

const normalizeExternalUrl = (value?: string | null) => {
  if (!value || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const extractChips = (source: unknown): ProductChip[] => {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return dedupeChips(source.flatMap((entry) => extractChips(entry)));
  }

  const record = asRecord(source);
  if (record) {
    const label = getDisplayText(
      record.name_en,
      record.name_ar,
      record.value_en,
      record.value_ar,
      record.name,
      record.label,
      record.value
    );

    if (label) {
      return [
        {
          label,
          colorCode: getDisplayText(record.color_code),
        },
      ];
    }

    return dedupeChips(Object.values(record).flatMap((entry) => extractChips(entry)));
  }

  const primitiveLabel = getDisplayText(source);
  return primitiveLabel ? [{ label: primitiveLabel }] : [];
};

const normalizeAttributeGroups = (source: unknown): ProductGroup[] => {
  if (!source) {
    return [];
  }

  const groups: ProductGroup[] = [];

  const pushGroup = (label: string, values: ProductChip[]) => {
    const nextValues = dedupeChips(values);
    if (!label || nextValues.length === 0) {
      return;
    }

    groups.push({ label, values: nextValues });
  };

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      const record = asRecord(entry);
      if (!record) {
        return;
      }

      const label =
        getDisplayText(
          record.name_en,
          record.name_ar,
          record.name,
          record.label,
          asRecord(record.attribute)?.name_en,
          asRecord(record.attribute)?.name_ar,
          asRecord(record.attribute)?.name,
          asRecord(record.attribute)?.label
        ) ?? `Attribute ${index + 1}`;

      const values = extractChips(
        record.values ?? record.attribute_values ?? record.selected_values ?? record.value
      );

      pushGroup(label, values);
    });

    return groups;
  }

  const sourceRecord = asRecord(source);
  if (!sourceRecord) {
    return [];
  }

  Object.entries(sourceRecord).forEach(([key, entry]) => {
    const record = asRecord(entry);
    if (!record) {
      return;
    }

    const label =
      getDisplayText(record.name_en, record.name_ar, record.name, record.label) ??
      `Attribute ${key}`;
    const values = extractChips(record.values ?? record.attribute_values ?? record.value);

    pushGroup(label, values);
  });

  return groups;
};

const normalizeSpecificationGroups = (source: unknown): ProductGroup[] => {
  if (!source) {
    return [];
  }

  const grouped = new Map<string, ProductChip[]>();

  const appendGroupValue = (label: string, chips: ProductChip[]) => {
    if (!label || chips.length === 0) {
      return;
    }

    const existing = grouped.get(label) ?? [];
    grouped.set(label, dedupeChips([...existing, ...chips]));
  };

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      const record = asRecord(entry);
      if (!record) {
        return;
      }

      const specification = asRecord(record.specification);
      const specificationValue = asRecord(record.specification_value) ?? record;

      const label =
        getDisplayText(
          specification?.name_en,
          specification?.name_ar,
          record.specification_name_en,
          record.specification_name_ar,
          record.name_en,
          record.name_ar,
          specificationValue?.specification_name_en,
          specificationValue?.specification_name_ar
        ) ??
        `Specification ${getDisplayText(specificationValue?.specification_id) ?? index + 1}`;

      appendGroupValue(label, extractChips(specificationValue));
    });

    return Array.from(grouped.entries()).map(([label, values]) => ({ label, values }));
  }

  const sourceRecord = asRecord(source);
  if (!sourceRecord) {
    return [];
  }

  Object.entries(sourceRecord).forEach(([key, entry]) => {
    const record = asRecord(entry);
    if (!record) {
      return;
    }

    const label =
      getDisplayText(record.name_en, record.name_ar, record.name, record.label) ??
      `Specification ${key}`;
    appendGroupValue(label, extractChips(record.values ?? record.value));
  });

  return Array.from(grouped.entries()).map(([label, values]) => ({ label, values }));
};

const getProductGalleryUrls = (product: ProductLike) => {
  const urls = new Set<string>();

  if (product.primary_image?.url) {
    urls.add(product.primary_image.url);
  }

  if (typeof product.image === "string" && product.image.trim()) {
    urls.add(product.image);
  }

  const directMedia = Array.isArray(product.media) ? [...product.media] : [];
  directMedia
    .sort((left: any, right: any) => (left?.sort_order ?? 0) - (right?.sort_order ?? 0))
    .forEach((mediaItem: any) => {
      if (mediaItem?.url) {
        urls.add(mediaItem.url);
      }
    });

  if (product.media_groups && typeof product.media_groups === "object") {
    Object.values(product.media_groups).forEach((group: any) => {
      const groupMedia = Array.isArray(group?.media) ? [...group.media] : [];
      groupMedia
        .sort((left: any, right: any) => (left?.sort_order ?? 0) - (right?.sort_order ?? 0))
        .forEach((mediaItem: any) => {
          if (mediaItem?.url) {
            urls.add(mediaItem.url);
          }
        });
    });
  }

  return Array.from(urls);
};

const getProductImageUrl = (product: ProductLike) => {
  return getProductGalleryUrls(product)[0] ?? null;
};

const getProductDisplayPrice = (product: ProductLike): PriceSummary | null => {
  let basePrice = null;
  let salePrice = null;

  if (product.variants?.length && product.price_groups) {
    const firstVariant = product.variants[0];
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
    if (typeof legacyPrice === "object") {
      basePrice = toPriceCandidate(legacyPrice.price);
      salePrice = toPriceCandidate(legacyPrice.sale_price);
    } else {
      basePrice = toPriceCandidate(legacyPrice);
      salePrice = toPriceCandidate(product.sale_price);
    }
  } else {
    salePrice = toPriceCandidate(product.sale_price);
  }

  if (basePrice && salePrice && basePrice.numericValue !== salePrice.numericValue) {
    const currentPrice =
      basePrice.numericValue <= salePrice.numericValue ? basePrice : salePrice;
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

const isProductOutOfStock = (product: ProductLike) => {
  return product.variants?.length
    ? product.variants.every((variant: any) => variant.is_out_of_stock === true)
    : product.is_out_of_stock === true;
};

const getCategoryName = (product: ProductLike) => {
  return product.categories?.[0]?.name_en || product.category?.name_en || null;
};

const getVendorName = (product: ProductLike) => {
  return product.vendor?.name_en || product.vendor?.name || null;
};

const getBrandName = (product: ProductLike) => {
  return product.brand?.name_en || product.brand?.name || null;
};

const getCreatorLabel = (product: ProductLike) => {
  if (!product.created_by) {
    return null;
  }

  return (
    [product.created_by.firstName, product.created_by.lastName].filter(Boolean).join(" ") ||
    product.created_by.email ||
    null
  );
};

const formatProductTimestamp = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const isoMatch = value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
    );

    if (isoMatch) {
      const [, year, month, day, hour, minute, second = "0"] = isoMatch;
      const localWallClockDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      return {
        date: localWallClockDate.toLocaleDateString(),
        time: localWallClockDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    date: parsedDate.toLocaleDateString(),
    time: parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const buildReviewSnapshot = (product: ProductLike): ReviewSnapshot => {
  return {
    imageUrl: getProductImageUrl(product),
    displayPrice: getProductDisplayPrice(product),
    visible: Boolean(product.visible ?? product.is_active),
    outOfStock: isProductOutOfStock(product),
    previewUrl: product.slug ? `/products/${product.slug}` : null,
    referenceUrl: normalizeExternalUrl(product.reference_link),
    attributes: normalizeAttributeGroups(product.attributes),
    specifications: normalizeSpecificationGroups(product.specifications),
  };
};

const openExternalLink = (url?: string | null) => {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};

function QueueStatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "warning";
}) {
  const toneStyles = {
    primary: "border-primary/15 bg-white/85 text-primary",
    success: "border-success/20 bg-white/90 text-success",
    warning: "border-yellow-200 bg-white/90 text-yellow-700",
  };

  return (
    <div
      className={`rounded-[20px] border p-4 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.35)] ${toneStyles[tone]}`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{hint}</p>
    </div>
  );
}

function ProductMetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-primary/10 bg-white/90 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold leading-6 text-gray-800">{value}</p>
    </div>
  );
}

function ProductGroupSection({
  title,
  groups,
  emptyText,
  icon,
  badgeVariant,
  iconClassName,
  chipClassName,
}: {
  title: string;
  groups: ProductGroup[];
  emptyText: string;
  icon: React.ReactNode;
  badgeVariant?: "default" | "default2" | "primary" | "secondary" | "success" | "danger" | "warning";
  iconClassName: string;
  chipClassName: string;
}) {
  const totalValues = groups.reduce((sum, group) => sum + group.values.length, 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-[linear-gradient(180deg,rgba(251,250,255,0.96),rgba(255,255,255,1))] p-4 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.45)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/6 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${iconClassName}`}>
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              {title}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-700">
              {groups.length > 0
                ? `${groups.length} groups • ${totalValues} selected values`
                : emptyText}
            </p>
          </div>
        </div>

        {groups.length > 0 ? <Badge variant={badgeVariant ?? "default2"}>{totalValues}</Badge> : null}
      </div>

      {groups.length === 0 ? (
        <div className="relative mt-5 rounded-[18px] border border-dashed border-primary/15 bg-white/80 px-4 py-5 text-center text-sm leading-6 text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.label}
              className="rounded-[18px] border border-primary/10 bg-white/92 p-3 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.55)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{group.label}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {group.values.length} values
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <span
                    key={`${group.label}-${value.label}-${value.colorCode ?? ""}`}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold text-gray-700 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] ${chipClassName}`}
                  >
                    {value.colorCode ? (
                      <span
                        className="h-3 w-3 rounded-full border border-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
                        style={{ backgroundColor: value.colorCode }}
                      />
                    ) : null}
                    <span>{value.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductReviewCard({
  item,
  onApprove,
  onDelete,
  isApproving,
}: {
  item: QueueItem;
  onApprove: (productId: number) => Promise<void>;
  onDelete: (product: Product) => void;
  isApproving: boolean;
}) {
  const { product, snapshot } = item;
  const createdAt = formatProductTimestamp(product.created_at as string | Date | undefined);
  const creator = getCreatorLabel(product as ProductLike) ?? "Unknown creator";
  const categoryName = getCategoryName(product as ProductLike) ?? "No category assigned";
  const vendorName = getVendorName(product as ProductLike) ?? "No vendor assigned";
  const brandName = getBrandName(product as ProductLike) ?? "No brand assigned";

  return (
    <Card className="gap-0 overflow-hidden border border-primary/10 p-0 shadow-[0_28px_65px_-40px_rgba(15,23,42,0.45)]">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(109,75,221,0.07),rgba(240,192,63,0.16),rgba(255,255,255,0.98))] p-5 md:p-6">
        <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
          <div className="grid gap-5 md:grid-cols-[132px_minmax(0,1fr)] md:items-start">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_18px_38px_-24px_rgba(15,23,42,0.65)] ring-1 ring-white/60">
              {snapshot.imageUrl ? (
                <Image
                  src={snapshot.imageUrl}
                  alt={product.name_en || "Product image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
              <div className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                #{product.id}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant={snapshot.visible ? "default2" : "danger"}>
                  {snapshot.visible ? "Visible" : "Hidden"}
                </Badge>
                <Badge variant={snapshot.outOfStock ? "warning" : "success"}>
                  {snapshot.outOfStock ? "Out of stock" : "In stock"}
                </Badge>
                <Badge variant={snapshot.referenceUrl ? "success" : "warning"}>
                  {snapshot.referenceUrl ? "Reference linked" : "Reference missing"}
                </Badge>
              </div>

              <div className="mt-4 min-w-0 rounded-3xl bg-white/75 p-4 shadow-[0_16px_35px_-32px_rgba(15,23,42,0.45)] ring-1 ring-white/70 backdrop-blur-sm">
                <h2 className="text-2xl font-black leading-tight tracking-tight text-gray-900 md:text-[32px]">
                  {product.name_en || "Untitled product"}
                </h2>
                <p dir="rtl" className="mt-2 text-sm leading-7 text-gray-500 md:text-base">
                  {product.name_ar || "No Arabic name yet"}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProductMetaItem icon={<Store className="h-4 w-4" />} label="Vendor" value={vendorName} />
                <ProductMetaItem icon={<Tag className="h-4 w-4" />} label="Brand" value={brandName} />
                <ProductMetaItem icon={<Boxes className="h-4 w-4" />} label="Category" value={categoryName} />
                <ProductMetaItem icon={<UserRound className="h-4 w-4" />} label="Created By" value={creator} />
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-[26px] border border-secondary/30 bg-white/90 p-5 shadow-[0_24px_40px_-30px_rgba(240,192,63,0.95)] xl:min-h-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Store Price
            </p>
            {snapshot.displayPrice ? (
              <div className="mt-3">
                <p className="text-3xl font-black tracking-tight text-gray-900">
                  {snapshot.displayPrice.currentPrice}
                </p>
                {snapshot.displayPrice.compareAtPrice ? (
                  <p className="mt-1 text-sm font-semibold text-gray-400 line-through">
                    {snapshot.displayPrice.compareAtPrice}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-danger">Price not set</p>
            )}

            <div className="mt-5 rounded-[20px] border border-primary/10 bg-[linear-gradient(180deg,rgba(109,75,221,0.06),rgba(255,255,255,0.95))] px-4 py-4 text-sm text-gray-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              {createdAt ? (
                <>
                  <p className="font-semibold text-gray-800">{createdAt.date}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{createdAt.time}</p>
                </>
              ) : (
                <p className="font-semibold text-gray-500">Creation date unavailable</p>
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="grid gap-4 xl:grid-cols-2">
          <ProductGroupSection
            title="Attributes"
            groups={snapshot.attributes}
            emptyText="No attributes available on this product."
            icon={<Tag className="h-5 w-5 text-white" />}
            badgeVariant="secondary"
            iconClassName="bg-secondary"
            chipClassName="border-secondary/15 bg-secondary/10"
          />
          <ProductGroupSection
            title="Specifications"
            groups={snapshot.specifications}
            emptyText="No specifications available on this product."
            icon={<Boxes className="h-5 w-5 text-white" />}
            badgeVariant="default"
            iconClassName="bg-primary"
            chipClassName="border-primary/12 bg-primary/8"
          />
        </div>

        <div className="rounded-3xl border border-primary/10 bg-[linear-gradient(180deg,rgba(248,247,255,0.96),rgba(255,255,255,1))] p-3 shadow-[0_22px_45px_-36px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <Button
                variant="outline"
                color="var(--color-primary2)"
                onClick={() => openExternalLink(snapshot.referenceUrl)}
                disabled={!snapshot.referenceUrl}
                className="border-primary/12 bg-white text-[15px] font-semibold shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:bg-primary2 hover:text-white"
              >
                <ExternalLink className="mr-2 inline h-4 w-4" />
                Reference Link
              </Button>

              <Button
                variant="outline"
                href={`/products/${product.id}`}
                color="#64748b"
                className="border-slate-200 bg-white text-[15px] font-semibold shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:bg-slate-600 hover:text-white"
              >
                <PencilLine className="mr-2 inline h-4 w-4" />
                Open editor
              </Button>

              <Button
                variant="outline"
                onClick={() => onDelete(product)}
                color="var(--color-danger)"
                className="border-danger/30 bg-white text-[15px] font-semibold shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:bg-danger hover:text-white"
              >
                <TriangleAlert className="mr-2 inline h-4 w-4" />
                Delete Permanently
              </Button>

            </div>

            <div className="xl:min-w-62.5">
              <Button
                onClick={() => onApprove(product.id)}
                disabled={isApproving}
                color="var(--color-success)"
                className="w-full text-[16px] font-semibold shadow-[0_22px_40px_-26px_rgba(107,209,39,0.9)] hover:-translate-y-0.5"
              >
                {isApproving ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                )}
                Approve & Activate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProductReviewPage() {
  const { setShowOverlay } = useLoading();
  const {
    page: storedPage,
    setPage: setStoredPage,
    limit: storedLimit,
    setLimit: setStoredLimit,
  } = useSessionStoragePage(REVIEW_STORAGE_KEY);

  const [queryParams, setQueryParams] = useState<ProductFilters>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(REVIEW_FILTERS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            page: storedPage,
            limit: storedLimit,
            status: "review",
          };
        } catch {
          // Ignore parse errors.
        }
      }
    }

    return {
      page: storedPage,
      limit: storedLimit,
      status: "review",
    };
  });

  const [searchTerm, setSearchTerm] = useState(queryParams.search || "");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    queryParams.vendor_ids?.split(",") || []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    queryParams.category_ids?.split(",") || []
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts(queryParams);
  const approveProduct = useUpdateProductWorkflowStatus();
  const permanentDeleteProduct = usePermanentDeleteProduct({
    onSuccess: () => {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    },
  });

  const { data: vendorsData } = useVendors();
  const categoriesData = useCategories();
  const products = data?.data.data || [];

  useEffect(() => {
    setStoredPage(queryParams.page ?? 1);
  }, [queryParams.page, setStoredPage]);

  useEffect(() => {
    if (queryParams.limit) {
      setStoredLimit(queryParams.limit);
    }
  }, [queryParams.limit, setStoredLimit]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { page, limit, status, ...filtersToStore } = queryParams;
      sessionStorage.setItem(REVIEW_FILTERS_STORAGE_KEY, JSON.stringify(filtersToStore));
    }
  }, [queryParams]);

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm !== (queryParams.search || "")) {
        setQueryParams((prev) => ({
          ...prev,
          search: searchTerm || undefined,
          page: 1,
          status: "review",
        }));
      }
    }, 350);

    return () => clearTimeout(debounce);
  }, [queryParams.search, searchTerm]);

  const vendorOptions = useMemo(() => {
    return (vendorsData?.data ?? []).map((vendor: any) => ({
      value: String(vendor.id),
      label: vendor.name_en || vendor.name || String(vendor.id),
    }));
  }, [vendorsData?.data]);

  const queueItems = useMemo<QueueItem[]>(() => {
    return products.map((product) => ({
      product,
      snapshot: buildReviewSnapshot(product as ProductLike),
    }));
  }, [products]);

  const queueStats = useMemo(() => {
    return {
      totalPending: String(data?.data.pagination?.total ?? 0),
      pageCount: String(queueItems.length),
    };
  }, [data?.data.pagination?.total, queueItems.length]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) || selectedVendorIds.length > 0 || selectedCategoryIds.length > 0;

  const handleVendorChange = (value: string | string[]) => {
    const normalized = Array.isArray(value) ? value : [value].filter(Boolean);
    setSelectedVendorIds(normalized);
    setQueryParams((prev) => ({
      ...prev,
      vendor_ids: normalized.length > 0 ? normalized.join(",") : undefined,
      page: 1,
      status: "review",
    }));
  };

  const handleCategoryChange = (ids: string[]) => {
    setSelectedCategoryIds(ids);
    setQueryParams((prev) => ({
      ...prev,
      category_ids: ids.length > 0 ? ids.join(",") : undefined,
      page: 1,
      status: "review",
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page, status: "review" }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, limit: pageSize, page: 1, status: "review" }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedVendorIds([]);
    setSelectedCategoryIds([]);
    setQueryParams({
      page: 1,
      limit: storedLimit,
      status: "review",
    });
  };

  const handleApproveProduct = async (productId: number) => {
    try {
      await approveProduct.mutateAsync({ id: productId, status: "active" });
    } catch (approveError) {
      console.error("Failed to approve product", approveError);
    }
  };

  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) {
      return;
    }

    try {
      await permanentDeleteProduct.mutateAsync(productToDelete.id);
    } catch (deleteError) {
      console.error("Failed to permanently delete product", deleteError);
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Error Loading Products Review</h3>
              <p className="mx-auto max-w-md">{error.message}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 p-5">
      <PageHeader
        icon={<Shield />}
        title="Products Review"
        description="Approve products directly, open the supplier reference link, and compare attributes and specifications without a separate review screen."
        extraActions={
          <Button
            variant="outline"
            color="var(--color-primary2)"
            onClick={() => refetch()}
            className="h-11 px-4 text-sm font-semibold"
          >
            <RefreshCw
              className={`mr-2 inline h-4 w-4 ${isFetching && !isLoading ? "animate-spin" : ""}`}
            />
            Refresh queue
          </Button>
        }
      />

      <Card className="overflow-hidden border border-primary/10 bg-[linear-gradient(135deg,rgba(109,75,221,0.08),rgba(255,255,255,0.96),rgba(240,192,63,0.12))] p-0 shadow-[0_30px_70px_-46px_rgba(15,23,42,0.55)]">
        <div className="relative overflow-hidden p-6 md:p-7">
          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-8 top-4 h-28 w-28 rounded-full bg-secondary/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Simplified approval flow
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                Check the source, compare the facts, approve the product.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                The review page now keeps the important information on the card itself. Your team can
                open the reference link, compare attributes and specifications, and approve directly
                from the queue.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:w-full xl:max-w-xl">
              <QueueStatCard
                icon={<Package className="h-5 w-5" />}
                label="Pending Queue"
                value={queueStats.totalPending}
                hint="Total products still waiting for approval across all pages."
                tone="primary"
              />
              <QueueStatCard
                icon={<Boxes className="h-5 w-5" />}
                label="On This Page"
                value={queueStats.pageCount}
                hint="Products currently visible in the review queue page."
                tone="success"
              />
            </div>
          </div>
        </div>
      </Card>

      {(products.length > 0 || hasActiveFilters) && (
        <Card className="border border-primary/10 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)_minmax(280px,1fr)]">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value.slice(0, 150))}
                label="Search Review Queue"
                variant="search"
                maxLength={150}
              />

              <div className="relative z-20">
                <Select
                  label="Vendor"
                  value={selectedVendorIds}
                  onChange={handleVendorChange}
                  options={vendorOptions}
                  search={vendorOptions.length > 6}
                  multiple={true}
                  placeholder="All vendors"
                  disabled={vendorOptions.length === 0}
                />
              </div>

              <div className="relative z-30">
                <CategoryTreeSelect
                  categories={categoriesData.data ?? []}
                  selectedIds={selectedCategoryIds}
                  onChange={handleCategoryChange}
                  singleSelect={false}
                  label="Category"
                  disabled={(categoriesData.data ?? []).length === 0}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 xl:justify-end">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-full border border-danger/20 bg-danger/5 px-4 py-2 font-semibold text-danger transition-all hover:bg-danger hover:text-white"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      )}

      {!isLoading && queueItems.length === 0 ? (
        hasActiveFilters ? (
          <Card className="border border-primary/10 py-14 text-center shadow-[0_24px_50px_-38px_rgba(15,23,42,0.45)]">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
              <div className="rounded-full bg-primary/8 p-4 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900">
                No products match the current filters
              </h3>
              <p className="text-sm leading-7 text-gray-600">
                Clear the filters to bring the full review queue back.
              </p>
              <Button variant="outline" onClick={handleClearFilters} color="var(--color-primary2)">
                Reset review filters
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Package />}
            title="No products waiting for review"
            description="The review queue is clear. New submissions will appear here automatically."
          />
        )
      ) : (
        <div className="grid w-full gap-5 xl:grid-cols-2">
          {queueItems.map((item) => (
            <ProductReviewCard
              key={item.product.id}
              item={item}
              onApprove={handleApproveProduct}
              onDelete={handleDeleteRequest}
              isApproving={
                approveProduct.isPending && approveProduct.variables?.id === item.product.id
              }
            />
          ))}
        </div>
      )}

      {data?.data.pagination ? (
        <Pagination
          pagination={{
            currentPage: data.data.pagination.page,
            pageSize: data.data.pagination.limit,
            totalItems: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages,
            hasNextPage: data.data.pagination.page < data.data.pagination.totalPages,
            hasPreviousPage: data.data.pagination.page > 1,
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Permanently?"
        message={`This will permanently delete ${productToDelete?.name_en || "this product"}. This action cannot be undone.`}
        confirmText="Delete Permanently"
        isPermanent={true}
        isLoading={permanentDeleteProduct.isPending}
      />
    </div>
  );
}
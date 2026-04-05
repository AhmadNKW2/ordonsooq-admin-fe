import React, { useEffect, useMemo, useState } from "react";
import { Select, type SelectOption } from "../../ui/select";
import { useProducts } from "../../../services/products/hooks/use-products";
import type { LinkedProductSummary, Product } from "../../../services/products/types/product.types";

interface LinkedProductsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string | boolean;
  excludeProductId?: string;
  initialSelectedProducts?: LinkedProductSummary[];
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 20;

const formatLinkedProductLabel = (product: {
  id: number | string;
  name_en?: string | null;
  name_ar?: string | null;
  sku?: string | null;
}) => {
  const displayName = product.name_en || product.name_ar || `Product #${product.id}`;
  const sku = product.sku?.trim() || "N/A";
  return `${displayName} - SKU: ${sku}`;
};

const toSelectOption = (product: {
  id: number | string;
  name_en?: string | null;
  name_ar?: string | null;
  sku?: string | null;
}): SelectOption => ({
  value: String(product.id),
  label: formatLinkedProductLabel(product),
});

export const LinkedProductsField: React.FC<LinkedProductsFieldProps> = ({
  value,
  onChange,
  error,
  excludeProductId,
  initialSelectedProducts = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [knownOptions, setKnownOptions] = useState<Record<string, SelectOption>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isFetching } = useProducts(
    {
      page: 1,
      limit: SEARCH_LIMIT,
      search: debouncedSearchQuery || undefined,
    },
    {
      enabled: true,
    }
  );

  const searchedOptions = useMemo(() => {
    return (data?.data.data || [])
      .filter((product: Product) => String(product.id) !== excludeProductId)
      .map((product: Product) => toSelectOption(product));
  }, [data?.data.data, excludeProductId]);

  useEffect(() => {
    setKnownOptions((previous) => {
      const next = { ...previous };

      initialSelectedProducts.forEach((product) => {
        if (String(product.id) === excludeProductId) {
          return;
        }

        next[String(product.id)] = toSelectOption(product);
      });

      searchedOptions.forEach((option) => {
        next[option.value] = option;
      });

      value.forEach((selectedId) => {
        if (!next[selectedId]) {
          next[selectedId] = {
            value: selectedId,
            label: `Product #${selectedId}`,
          };
        }
      });

      return next;
    });
  }, [excludeProductId, initialSelectedProducts, searchedOptions, value]);

  const options = useMemo(() => {
    const selected = value
      .filter((selectedId) => selectedId !== excludeProductId)
      .map((selectedId) => knownOptions[selectedId] || {
        value: selectedId,
        label: `Product #${selectedId}`,
      });

    const selectedSet = new Set(selected.map((option) => option.value));
    const remaining = Object.values(knownOptions)
      .filter((option) => option.value !== excludeProductId && !selectedSet.has(option.value))
      .sort((left, right) => left.label.localeCompare(right.label));

    if (isFetching && selected.length === 0 && remaining.length === 0) {
      return [
        {
          value: "__loading__",
          label: "Loading products...",
          disabled: true,
        },
      ];
    }

    return [...selected, ...remaining];
  }, [excludeProductId, isFetching, knownOptions, value]);

  return (
    <Select
      id="linked_product_ids"
      name="linked_product_ids"
      label="Linked Products"
      value={value.filter((selectedId) => selectedId !== excludeProductId)}
      onChange={(nextValue) => {
        const nextIds = Array.isArray(nextValue) ? nextValue : [];
        onChange(nextIds.filter((selectedId) => selectedId !== excludeProductId));
      }}
      onClear={() => onChange([])}
      options={options}
      multiple
      search
      onSearchChange={setSearchQuery}
      error={error}
    />
  );
};
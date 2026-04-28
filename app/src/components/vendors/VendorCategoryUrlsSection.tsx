"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { CategoryTreeSelect } from "../products/CategoryTreeSelect";
import { queryKeys } from "../../lib/query-keys";
import { showErrorToast, showInfoToast, showSuccessToast } from "../../lib/toast";
import { categoryUrlService } from "../../services/categories/api/category-url.service";
import { useCategories } from "../../services/categories/hooks/use-categories";
import { useVendorCategoryUrls } from "../../services/categories/hooks/use-category-urls";
import { Category } from "../../services/categories/types/category.types";
import { CategoryUrlMapping } from "../../services/categories/types/category-url.types";

interface VendorCategoryUrlsSectionProps {
  mode: "create" | "edit";
  vendorId?: number;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface PersistedMappingRef {
  id: number;
  categoryId: string;
  sortOrder?: number;
}

interface MappingRow {
  localId: string;
  categoryIds: string[];
  persistedMappings: PersistedMappingRef[];
  url: string;
}

interface NormalizedMapping {
  id: number;
  categoryId: string;
  sortOrder?: number;
  url: string;
}

const EMPTY_CATEGORY_URL_MAPPINGS: CategoryUrlMapping[] = [];
const RECENT_CATEGORY_KEY = "recent_category_ids";

const getRecentIds = (key: string): string[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentId = (key: string, id: string | string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const recent = getRecentIds(key);
    const ids = Array.isArray(id) ? id : [id];
    if (ids.length === 0) {
      return;
    }

    const updated = [...new Set([...ids, ...recent])].slice(0, 5);
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore localStorage issues
  }
};

const createLocalRowId = () =>
  `vendor-category-url-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyRow = (): MappingRow => ({
  localId: createLocalRowId(),
  categoryIds: [],
  persistedMappings: [],
  url: "",
});

const normalizeCategoryIds = (categoryIds: string[]) => {
  const normalizedIds = categoryIds
    .map((categoryId) => categoryId.trim())
    .filter(Boolean);

  return Array.from(new Set(normalizedIds));
};

const normalizeNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const normalizeString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
};

const toNormalizedMapping = (
  mapping: CategoryUrlMapping | Record<string, unknown>
): NormalizedMapping | null => {
  const mappingRecord = mapping as Record<string, unknown>;
  const mappingId = normalizeNumber(
    mappingRecord.id,
    mappingRecord.urlId,
    mappingRecord.url_id,
    mappingRecord.mapping_id
  );
  const category = typeof mappingRecord.category === "object" && mappingRecord.category !== null
    ? (mappingRecord.category as Record<string, unknown>)
    : undefined;
  const categoryId = normalizeNumber(
    mappingRecord.category_id,
    mappingRecord.categoryId,
    category?.id,
    category?.category_id
  );
  const url = normalizeString(
    mappingRecord.url,
    mappingRecord.category_url,
    mappingRecord.custom_url,
    mappingRecord.slug
  ).trim();
  const sortOrder = normalizeNumber(mappingRecord.sort_order, mappingRecord.sortOrder);

  if (mappingId === undefined || categoryId === undefined || url.length === 0) {
    return null;
  }

  return {
    id: mappingId,
    categoryId: categoryId ? String(categoryId) : "",
    sortOrder,
    url,
  };
};

const groupMappingsByUrl = (mappings: NormalizedMapping[]): MappingRow[] => {
  const groupedRows = new Map<string, MappingRow>();

  for (const mapping of mappings) {
    const groupKey = mapping.url;
    const existingRow = groupedRows.get(groupKey);

    if (!existingRow) {
      groupedRows.set(groupKey, {
        localId: `vendor-category-url-${mapping.id}`,
        categoryIds: mapping.categoryId ? [mapping.categoryId] : [],
        persistedMappings: [
          {
            id: mapping.id,
            categoryId: mapping.categoryId,
            sortOrder: mapping.sortOrder,
          },
        ],
        url: mapping.url,
      });
      continue;
    }

    existingRow.categoryIds = normalizeCategoryIds([
      ...existingRow.categoryIds,
      mapping.categoryId,
    ]);
    existingRow.persistedMappings.push({
      id: mapping.id,
      categoryId: mapping.categoryId,
      sortOrder: mapping.sortOrder,
    });
  }

  return Array.from(groupedRows.values());
};

const findInTree = (categories: Category[], id: string): Category | undefined => {
  for (const category of categories) {
    if (category.id.toString() === id) {
      return category;
    }

    if (category.children) {
      const childMatch = findInTree(category.children, id);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return undefined;
};

const isRowFilled = (row?: MappingRow) => {
  if (!row) {
    return false;
  }

  return row.categoryIds.length > 0 && row.url.trim().length > 0;
};

const toComparableRows = (rows: MappingRow[]) => {
  return rows
    .map((row) => ({
      categoryIds: [...normalizeCategoryIds(row.categoryIds)].sort(),
      url: row.url.trim(),
    }))
    .filter((row) => row.categoryIds.length > 0 || row.url);
};

export const VendorCategoryUrlsSection: React.FC<VendorCategoryUrlsSectionProps> = ({
  mode,
  vendorId,
  onDirtyChange,
}) => {
  const queryClient = useQueryClient();
  const isCreateMode = mode === "create";
  const isDisabled = isCreateMode || !vendorId;

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: vendorMappings = EMPTY_CATEGORY_URL_MAPPINGS, isLoading: isMappingsLoading } = useVendorCategoryUrls(
    vendorId,
    undefined,
    { enabled: !isDisabled }
  );

  const normalizedPersistedMappings = useMemo(() => {
    return vendorMappings
      .map((mapping) => toNormalizedMapping(mapping))
      .filter((mapping): mapping is NormalizedMapping => mapping !== null);
  }, [vendorMappings]);

  const persistedRows = useMemo(
    () => {
      const groupedRows = groupMappingsByUrl(normalizedPersistedMappings);
      return groupedRows.length > 0 ? groupedRows : [createEmptyRow()];
    },
    [normalizedPersistedMappings]
  );

  const [rows, setRows] = useState<MappingRow[]>(() => [createEmptyRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const lastRow = rows[rows.length - 1];
  const canAddRow = isRowFilled(lastRow);
  const currentComparableRows = useMemo(() => toComparableRows(rows), [rows]);
  const persistedComparableRows = useMemo(
    () => toComparableRows(persistedRows),
    [persistedRows]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (isDisabled) {
      return false;
    }

    return JSON.stringify(currentComparableRows) !== JSON.stringify(persistedComparableRows);
  }, [currentComparableRows, isDisabled, persistedComparableRows]);
  const selectedCategoryIds = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => row.categoryIds).filter(Boolean))),
    [rows]
  );

  useEffect(() => {
    if (isDisabled) {
      setRows([createEmptyRow()]);
      return;
    }

    setRows(persistedRows);
  }, [isDisabled, persistedRows]);

  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      addRecentId(RECENT_CATEGORY_KEY, selectedCategoryIds);
    }
  }, [selectedCategoryIds]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    return () => {
      onDirtyChange?.(false);
    };
  }, [onDirtyChange]);

  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const recentCategoriesList = useMemo(() => {
    const recentIds = getRecentIds(RECENT_CATEGORY_KEY);
    if (!recentIds.length) {
      return [];
    }

    return recentIds
      .map((id) => findInTree(categories, id))
      .filter((category): category is Category => !!category);
  }, [categories]);

  const sortedCategories = useMemo(() => {
    const recentIds = getRecentIds(RECENT_CATEGORY_KEY);
    const priorityIds = new Set([...selectedCategoryIds, ...recentIds].filter(Boolean));

    if (priorityIds.size === 0) {
      return categories;
    }

    const isPriorityNode = (category: Category): boolean => {
      if (priorityIds.has(category.id.toString())) {
        return true;
      }

      return category.children?.some(isPriorityNode) ?? false;
    };

    const sortTree = (nodes: Category[]): Category[] => {
      const priority = nodes.filter(isPriorityNode);
      const rest = nodes.filter((node) => !isPriorityNode(node));

      priority.sort((left, right) => {
        const leftId = left.id.toString();
        const rightId = right.id.toString();
        const leftSelected = selectedCategoryIds.includes(leftId);
        const rightSelected = selectedCategoryIds.includes(rightId);

        if (leftSelected && !rightSelected) {
          return -1;
        }

        if (!leftSelected && rightSelected) {
          return 1;
        }

        const leftRecentIndex = recentIds.indexOf(leftId);
        const rightRecentIndex = recentIds.indexOf(rightId);

        if (leftRecentIndex !== -1 && rightRecentIndex !== -1) {
          return leftRecentIndex - rightRecentIndex;
        }

        if (leftRecentIndex !== -1) {
          return -1;
        }

        if (rightRecentIndex !== -1) {
          return 1;
        }

        return 0;
      });

      return [
        ...priority.map((node) => ({
          ...node,
          children: node.children ? sortTree(node.children) : undefined,
        })),
        ...rest.map((node) => ({
          ...node,
          children: node.children ? sortTree(node.children) : undefined,
        })),
      ];
    };

    return sortTree(categories);
  }, [categories, selectedCategoryIds]);

  const persistedMappingsById = useMemo(
    () => new Map(normalizedPersistedMappings.map((mapping) => [mapping.id, mapping])),
    [normalizedPersistedMappings]
  );

  const handleRowChange = (localId: string, updates: Partial<MappingRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.localId === localId
          ? {
              ...row,
              ...updates,
            }
          : row
      )
    );
  };

  const handleAddRow = () => {
    if (!canAddRow) {
      showErrorToast("Fill the current category URL mapping before adding another one.");
      return;
    }

    setRows((currentRows) => [...currentRows, createEmptyRow()]);
  };

  const handleRemoveRow = (rowToRemove: MappingRow) => {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.localId !== rowToRemove.localId);
      return nextRows.length > 0 ? nextRows : [createEmptyRow()];
    });
  };

  const handleSave = async () => {
    if (!vendorId) {
      return;
    }

    const normalizedRows = rows.map((row) => ({
      ...row,
      categoryIds: normalizeCategoryIds(row.categoryIds),
      url: row.url.trim(),
    }));

    const activeRows = normalizedRows.filter((row) => row.categoryIds.length > 0 || row.url);
    const hasIncompleteRow = activeRows.some((row) => row.categoryIds.length === 0 || !row.url);

    if (hasIncompleteRow) {
      showErrorToast("Select at least one category and enter a URL for each category URL mapping.");
      return;
    }

    const desiredMappings = activeRows.flatMap((row) =>
      row.categoryIds.map((categoryId) => ({
        id: row.persistedMappings.find((mapping) => mapping.categoryId === categoryId)?.id,
        categoryId,
        url: row.url,
      }))
    );

    const uniqueMappingKeys = new Set<string>();
    for (const mapping of desiredMappings) {
      const mappingKey = `${mapping.categoryId}::${mapping.url}`;
      if (uniqueMappingKeys.has(mappingKey)) {
        showErrorToast("Duplicate category URL mappings are not allowed for the same category and URL.");
        return;
      }

      uniqueMappingKeys.add(mappingKey);
    }

    const desiredMappingIds = new Set(
      desiredMappings
        .map((mapping) => mapping.id)
        .filter((mappingId): mappingId is number => typeof mappingId === "number")
    );

    const rowsToCreate = desiredMappings.filter((mapping) => !mapping.id);
    const rowsToUpdate = desiredMappings.filter((mapping) => {
      if (!mapping.id) {
        return false;
      }

      const persistedMapping = persistedMappingsById.get(mapping.id);
      if (!persistedMapping) {
        return false;
      }

      return (
        persistedMapping.categoryId !== mapping.categoryId ||
        persistedMapping.url !== mapping.url
      );
    });
    const idsToDelete = normalizedPersistedMappings
      .filter((mapping) => !desiredMappingIds.has(mapping.id))
      .map((mapping) => mapping.id);

    if (rowsToCreate.length === 0 && rowsToUpdate.length === 0 && idsToDelete.length === 0) {
      showInfoToast("No category URL changes to save.");
      return;
    }

    setIsSaving(true);

    try {
      for (const mappingId of idsToDelete) {
        await categoryUrlService.deleteCategoryUrlMapping(mappingId);
      }

      for (const row of rowsToCreate) {
        await categoryUrlService.createCategoryUrlMapping({
          category_id: Number(row.categoryId),
          vendor_id: vendorId,
          url: row.url,
        });
      }

      for (const row of rowsToUpdate) {
        await categoryUrlService.updateCategoryUrlMapping(row.id as number, {
          category_id: Number(row.categoryId),
          vendor_id: vendorId,
          url: row.url,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.categories.vendorUrls(vendorId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.categories.urls(),
        }),
      ]);

      showSuccessToast("Category URL mappings saved successfully.");
    } catch (error) {
      console.error("Failed to save vendor category URL mappings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-r1 bg-primary/10 p-3 text-primary [&>svg]:h-5 [&>svg]:w-5">
              <Link2 />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Category URL Mappings</h2>
              <p className="text-sm text-gray-500">
                Assign vendor-specific category URLs here. Saving vendor details does not save category URL mappings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleAddRow}
              disabled={isDisabled || isSaving || isCategoriesLoading || !canAddRow}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Mapping
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={
                isDisabled ||
                isSaving ||
                isMappingsLoading ||
                isCategoriesLoading ||
                !hasUnsavedChanges
              }
            >
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Category URL Changes"}
              </span>
            </Button>
          </div>
        </div>

        {!isDisabled && (
          <div
            className={`rounded-r1 border p-4 text-sm ${
              hasUnsavedChanges
                ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                : "border-primary/15 bg-primary/5 text-gray-600"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={hasUnsavedChanges ? "warning" : "default"}>
                {hasUnsavedChanges ? "Unsaved mapping changes" : "Mappings saved separately"}
              </Badge>
              <span>
                Saving vendor details does not save category URL mappings. Use the section button to save mapping changes.
              </span>
            </div>
          </div>
        )}

        {isDisabled && (
          <div className="rounded-r1 border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-gray-600">
            Save the vendor first, then use this section to add category-specific URLs for that vendor.
          </div>
        )}

        {!isDisabled && isMappingsLoading && (
          <div className="rounded-r1 bg-gray-50 p-4 text-sm text-gray-500">
            Loading existing category URL mappings...
          </div>
        )}

        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.localId}
              className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]"
            >
              <CategoryTreeSelect
                label="Categories"
                categories={sortedCategories}
                recentCategories={recentCategoriesList}
                selectedIds={row.categoryIds}
                onChange={(ids) => handleRowChange(row.localId, { categoryIds: normalizeCategoryIds(ids) })}
                singleSelect={false}
                disabled={isDisabled || isSaving || isCategoriesLoading}
              />

              <Input
                label="URL"
                value={row.url}
                onChange={(event) => handleRowChange(row.localId, { url: event.target.value })}
                disabled={isDisabled || isSaving}
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  isSquare
                  onClick={() => handleRemoveRow(row)}
                  disabled={isDisabled || isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
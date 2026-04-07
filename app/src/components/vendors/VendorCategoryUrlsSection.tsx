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

interface MappingRow {
  localId: string;
  id?: number;
  categoryId: string;
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
  categoryId: "",
  url: "",
});

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

const toMappingRow = (mapping: CategoryUrlMapping | Record<string, unknown>): MappingRow | null => {
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

  if (!mappingId && !categoryId && url.length === 0) {
    return null;
  }

  return {
    localId: `vendor-category-url-${mappingId ?? createLocalRowId()}`,
    id: mappingId,
    categoryId: categoryId ? String(categoryId) : "",
    url,
  };
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

const areRowsEqual = (left?: MappingRow, right?: MappingRow) => {
  if (!left || !right) {
    return false;
  }

  return left.categoryId === right.categoryId && left.url.trim() === right.url.trim();
};

const isRowFilled = (row?: MappingRow) => {
  if (!row) {
    return false;
  }

  return row.categoryId.trim().length > 0 && row.url.trim().length > 0;
};

const toComparableRows = (rows: MappingRow[]) => {
  return rows
    .map((row) => ({
      categoryId: row.categoryId.trim(),
      url: row.url.trim(),
    }))
    .filter((row) => row.categoryId || row.url);
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

  const normalizedPersistedRows = useMemo(() => {
    const normalizedRows = vendorMappings
      .map((mapping) => toMappingRow(mapping))
      .filter((row): row is MappingRow => row !== null);

    return normalizedRows;
  }, [vendorMappings]);

  const persistedRows = useMemo(
    () => (normalizedPersistedRows.length > 0 ? normalizedPersistedRows : [createEmptyRow()]),
    [normalizedPersistedRows]
  );

  const [rows, setRows] = useState<MappingRow[]>(() => [createEmptyRow()]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const lastRow = rows[rows.length - 1];
  const canAddRow = isRowFilled(lastRow);
  const currentComparableRows = useMemo(() => toComparableRows(rows), [rows]);
  const persistedComparableRows = useMemo(
    () => toComparableRows(normalizedPersistedRows),
    [normalizedPersistedRows]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (isDisabled) {
      return false;
    }

    return (
      deletedIds.length > 0 ||
      JSON.stringify(currentComparableRows) !== JSON.stringify(persistedComparableRows)
    );
  }, [currentComparableRows, deletedIds.length, isDisabled, persistedComparableRows]);
  const selectedCategoryIds = useMemo(
    () => rows.map((row) => row.categoryId).filter(Boolean),
    [rows]
  );

  useEffect(() => {
    if (isDisabled) {
      setRows([createEmptyRow()]);
      setDeletedIds([]);
      return;
    }

    setRows(persistedRows);
    setDeletedIds([]);
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

  const persistedRowsById = useMemo(
    () => new Map(persistedRows.filter((row) => row.id).map((row) => [row.id as number, row])),
    [persistedRows]
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
    if (rowToRemove.id) {
      setDeletedIds((currentIds) =>
        currentIds.includes(rowToRemove.id as number)
          ? currentIds
          : [...currentIds, rowToRemove.id as number]
      );
    }

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
      categoryId: row.categoryId.trim(),
      url: row.url.trim(),
    }));

    const activeRows = normalizedRows.filter((row) => row.categoryId || row.url);
    const hasIncompleteRow = activeRows.some((row) => !row.categoryId || !row.url);

    if (hasIncompleteRow) {
      showErrorToast("Select a category and enter a URL for each category URL mapping.");
      return;
    }

    const uniqueCategoryIds = new Set<string>();
    for (const row of activeRows) {
      if (uniqueCategoryIds.has(row.categoryId)) {
        showErrorToast("Each category can only be mapped once per vendor.");
        return;
      }

      uniqueCategoryIds.add(row.categoryId);
    }

    const rowsToCreate = activeRows.filter((row) => !row.id);
    const rowsToUpdate = activeRows.filter((row) => {
      if (!row.id) {
        return false;
      }

      return !areRowsEqual(row, persistedRowsById.get(row.id));
    });
    const idsToDelete = Array.from(new Set(deletedIds));

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

      setDeletedIds([]);

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
                label="Category"
                categories={sortedCategories}
                recentCategories={recentCategoriesList}
                selectedIds={row.categoryId ? [row.categoryId] : []}
                onChange={(ids) => handleRowChange(row.localId, { categoryId: ids[0] || "" })}
                singleSelect={true}
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
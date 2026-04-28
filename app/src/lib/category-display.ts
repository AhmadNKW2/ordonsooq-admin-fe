import { Category } from "../services/categories/types/category.types";

type CategoryLabelSource = {
  id: number;
  name_en?: string | null;
  name_ar?: string | null;
};

export const ALL_CATEGORIES_LABEL = "All categories";

const getCategoryLabel = (category: CategoryLabelSource): string => {
  const englishName = category.name_en?.trim();
  if (englishName) {
    return englishName;
  }

  const arabicName = category.name_ar?.trim();
  if (arabicName) {
    return arabicName;
  }

  return `Category #${category.id}`;
};

export const buildCategoryNameMap = (categories: Category[] = []): Map<number, string> => {
  const categoryNameMap = new Map<number, string>();

  const visit = (nodes: Category[]) => {
    for (const category of nodes) {
      categoryNameMap.set(category.id, getCategoryLabel(category));

      if (category.children?.length) {
        visit(category.children);
      }
    }
  };

  visit(categories);

  return categoryNameMap;
};

export const getEntityCategoryLabels = (
  categoryIds: number[] = [],
  categories: CategoryLabelSource[] = [],
  categoryNameMap: Map<number, string>
): string[] => {
  const labels = categories.length > 0
    ? categories.map(
        (category) => categoryNameMap.get(category.id) || getCategoryLabel(category)
      )
    : categoryIds.map(
        (categoryId) => categoryNameMap.get(categoryId) || `Category #${categoryId}`
      );

  return Array.from(new Set(labels));
};
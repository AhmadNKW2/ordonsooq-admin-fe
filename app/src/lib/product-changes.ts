export interface ProductChangesPayload {
  add_product_ids: number[];
  remove_product_ids: number[];
}

function normalizeProductIds(productIds: number[] | undefined): number[] {
  if (!productIds) {
    return [];
  }

  const seen = new Set<number>();

  for (const productId of productIds) {
    if (!Number.isInteger(productId) || seen.has(productId)) {
      continue;
    }

    seen.add(productId);
  }

  return [...seen];
}

export function buildCreateProductChanges(
  productIds: number[] | undefined
): ProductChangesPayload | undefined {
  const addProductIds = normalizeProductIds(productIds);

  if (addProductIds.length === 0) {
    return undefined;
  }

  return {
    add_product_ids: addProductIds,
    remove_product_ids: [],
  };
}

export function buildUpdateProductChanges(
  originalProductIds: number[] | undefined,
  nextProductIds: number[] | undefined
): ProductChangesPayload | undefined {
  const originalIds = normalizeProductIds(originalProductIds);
  const nextIds = normalizeProductIds(nextProductIds);
  const originalSet = new Set(originalIds);
  const nextSet = new Set(nextIds);

  const addProductIds = nextIds.filter((productId) => !originalSet.has(productId));
  const removeProductIds = originalIds.filter((productId) => !nextSet.has(productId));

  if (addProductIds.length === 0 && removeProductIds.length === 0) {
    return undefined;
  }

  return {
    add_product_ids: addProductIds,
    remove_product_ids: removeProductIds,
  };
}

export function appendProductChangesField(
  formData: FormData,
  productChanges: ProductChangesPayload | undefined
) {
  if (!productChanges) {
    return;
  }

  formData.append("product_changes", JSON.stringify(productChanges));
}
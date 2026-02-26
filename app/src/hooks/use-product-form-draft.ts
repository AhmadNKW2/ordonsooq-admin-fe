/**
 * useProductFormDraft
 *
 * Persists the create-product form to localStorage so the user does not lose
 * their work on accidental navigation / refresh.
 *
 * - Saves automatically (debounced) whenever formData changes.
 * - Strips File objects and blob: preview URLs because they cannot be
 *   serialised to JSON.  When the user comes back to the form the media
 *   section will be empty (they must re-select images) but all text fields,
 *   selects, prices, dimensions, etc. are fully restored.
 * - Call clearDraft() on successful creation or on explicit cancel.
 */

import { useEffect, useRef, useCallback } from "react";
import { ProductFormData, MediaItem, VariantMedia } from "../services/products/types/product-form.types";

const DRAFT_KEY = "product_create_draft";
const DEBOUNCE_MS = 600;

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

function stripMediaItem(item: MediaItem): MediaItem {
  return {
    ...item,
    file: null,
    // Blob URLs are revoked when the tab closes – persist nothing for them.
    preview: item.preview.startsWith("blob:") ? "" : item.preview,
  };
}

function serializeFormData(data: Partial<ProductFormData>): string {
  const serializable: Partial<ProductFormData> = {
    ...data,
    singleMedia: (data.singleMedia ?? []).map(stripMediaItem),
    variantMedia: (data.variantMedia ?? []).map((vm: VariantMedia) => ({
      ...vm,
      media: vm.media.map(stripMediaItem),
    })),
  };
  return JSON.stringify(serializable);
}

function deserializeFormData(raw: string): Partial<ProductFormData> | null {
  try {
    return JSON.parse(raw) as Partial<ProductFormData>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseProductFormDraftOptions {
  /** Only run when the form is in create mode. */
  enabled: boolean;
}

interface UseProductFormDraftReturn {
  /** Restore value from localStorage (null if there is no saved draft). */
  restoredDraft: Partial<ProductFormData> | null;
  /** Save the current form state to localStorage (already debounced internally). */
  saveDraft: (data: Partial<ProductFormData>) => void;
  /** Immediately remove the draft from localStorage. */
  clearDraft: () => void;
}

export function useProductFormDraft({
  enabled,
}: UseProductFormDraftOptions): UseProductFormDraftReturn {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read once on mount so the caller can use it as initial form state.
  const restoredDraft = useRef<Partial<ProductFormData> | null>(null);
  if (enabled && restoredDraft.current === null) {
    try {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem(DRAFT_KEY)
        : null;
      if (raw) {
        restoredDraft.current = deserializeFormData(raw);
      }
    } catch {
      // localStorage might be unavailable (private browsing, etc.)
    }
  }

  const saveDraft = useCallback(
    (data: Partial<ProductFormData>) => {
      if (!enabled) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, serializeFormData(data));
        } catch {
          // Storage quota exceeded or unavailable – fail silently.
        }
      }, DEBOUNCE_MS);
    },
    [enabled]
  );

  const clearDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Clean up pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    restoredDraft: restoredDraft.current,
    saveDraft,
    clearDraft,
  };
}

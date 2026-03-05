/**
 * useEnterToSubmit
 *
 * Listens for the Enter key on the document and calls the provided submit
 * function — skipping when:
 *  • focus is inside a <textarea> (preserves newline behaviour)
 *  • `disabled` is true (e.g. form is already submitting)
 *
 * Uses a ref to always call the latest version of `onSubmit` without
 * needing to re-register the listener on every render.
 */

import { useEffect, useRef } from "react";

export function useEnterToSubmit(
  onSubmit: () => void,
  disabled: boolean = false
): void {
  const onSubmitRef = useRef(onSubmit);
  // Keep ref current without re-subscribing the listener.
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      
      // Let textarea handle newlines on Shift+Enter, otherwise submit
      if (tag === "textarea") {
        if (e.shiftKey) return; // Allow Shift+Enter in textarea
        e.preventDefault(); // Prevent new line on regular Enter
      } else if (e.shiftKey) {
        return; // Maybe other things need Shift+Enter? Typically no, but just in case
      }

      if (disabled) return;
      e.preventDefault();
      onSubmitRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled]);
}

"use client";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { TermsInput } from "./TermsInput";

interface ConceptFormProps {
  conceptKey: string;
  onConceptKeyChange: (v: string) => void;
  conceptKeyAr?: string;
  onConceptKeyArChange?: (v: string) => void;
  termsEn: string[];
  onTermsEnChange: (t: string[]) => void;
  termsAr: string[];
  onTermsArChange: (t: string[]) => void;
  onSubmit: () => void;
  /** Shown alongside submit when provided and isDirty is true */
  onDiscard?: () => void;
  /** Shown as a plain cancel button (e.g. create page) */
  onCancel?: () => void;
  isLoading: boolean;
  canSubmit: boolean;
  submitLabel?: string;
  /** Card section title — omit for create page */
  title?: string;
  isDirty?: boolean;
  /** Warning shown below buttons when isDirty is true */
  dirtyWarning?: string;
  /** Validation hint shown when form is incomplete (create page) */
  showValidationHint?: boolean;
}

export function ConceptForm({
  conceptKey,
  onConceptKeyChange,
  conceptKeyAr,
  onConceptKeyArChange,
  termsEn,
  onTermsEnChange,
  termsAr,
  onTermsArChange,
  onSubmit,
  onDiscard,
  onCancel,
  isLoading,
  canSubmit,
  submitLabel = "Save",
  title,
  isDirty,
  dirtyWarning,
  showValidationHint,
}: ConceptFormProps) {
  return (
    <Card className="max-w-2xl">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}

      <div className="space-y-2">
        <Input
          label="Concept Key (EN)"
          placeholder="e.g. power_bank (2–60 chars, auto-normalised)"
          value={conceptKey}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onConceptKeyChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Spaces are converted to underscores. Must be unique across all concepts.
        </p>
      </div>

      {onConceptKeyArChange !== undefined && (
        <div className="space-y-2">
          <Input
            label="Concept Key (AR)"
            placeholder="مثال: شاحن متنقل (اختياري)"
            value={conceptKeyAr ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onConceptKeyArChange(e.target.value)}
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground">
            Arabic display name for this concept — set automatically by AI.
          </p>
        </div>
      )}

      <TermsInput
        label="English Terms (min 2, max 12)"
        terms={termsEn}
        onChange={onTermsEnChange}
        placeholder="Type an English synonym and press Enter"
        dir="ltr"
      />

      <TermsInput
        label="Arabic Terms (min 2, max 12)"
        terms={termsAr}
        onChange={onTermsArChange}
        placeholder="اكتب مرادفاً عربياً واضغط Enter"
        dir="rtl"
      />

      <div className="flex gap-3">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isLoading}
          color="var(--color-primary)"
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>

        {onDiscard && isDirty && (
          <Button variant="outline" onClick={onDiscard} disabled={isLoading}>
            Discard
          </Button>
        )}

        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
      </div>

      {dirtyWarning && isDirty && (
        <p className="text-xs text-amber-600">{dirtyWarning}</p>
      )}

      {showValidationHint && !canSubmit && (conceptKey || termsEn.length > 0 || termsAr.length > 0) && (
        <p className="text-sm text-amber-600">
          Please provide a concept key (≥ 2 chars) and at least 2 English + 2 Arabic terms.
        </p>
      )}
    </Card>
  );
}

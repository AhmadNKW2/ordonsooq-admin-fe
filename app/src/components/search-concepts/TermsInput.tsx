"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";

interface TermsInputProps {
  label: string;
  terms: string[];
  onChange: (terms: string[]) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  maxTerms?: number;
  minTerms?: number;
}

export function TermsInput({
  label,
  terms,
  onChange,
  placeholder,
  dir,
  maxTerms = 12,
  minTerms = 2,
}: TermsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTerm = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed || terms.includes(trimmed) || terms.length >= maxTerms) return;
    onChange([...terms, trimmed]);
    setInputValue("");
  };

  const removeTerm = (idx: number) => onChange(terms.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label={label}
            placeholder={placeholder ?? "Type and press Enter"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTerm();
              }
            }}
            isRtl={dir === "rtl"}
          />
        </div>
        <Button
          variant="outline"
          isSquare
          onClick={addTerm}
          disabled={!inputValue.trim() || terms.length >= maxTerms}
          color="var(--color-primary)"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {terms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {terms.map((term, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
              dir={dir}
            >
              {term}
              <button
                type="button"
                onClick={() => removeTerm(idx)}
                className="ml-1 hover:text-danger transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {terms.length} / {maxTerms} terms{minTerms > 0 ? ` (minimum ${minTerms} required)` : ""}
      </p>
    </div>
  );
}

"use client";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface TagFormProps {
  name: string;
  onChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel?: string;
}

export function TagForm({
  name,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Create Tag",
}: TagFormProps) {
  const canSubmit = name.trim().length > 0;

  return (
    <Card className="max-w-lg">
      <Input
        label="Tag Name"
        placeholder="e.g. foldable, 5g, wireless-charging"
        value={name}
        onChange={(e) => onChange(e.target.value)}
      />

      <p className="text-sm text-muted-foreground">
        Tag names are automatically lowercased and normalised. When a new tag is created,
        the AI will generate synonym concept suggestions in the background.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isLoading}
          color="var(--color-primary)"
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

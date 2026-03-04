"use client";

import { useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import type { CashbackRule, CreateCashbackRuleDto } from "../../services/cashback-rules/types/cashback-rule.types";

interface CashbackRuleFormProps {
  initial?: Partial<CashbackRule>;
  onSubmit: (data: CreateCashbackRuleDto) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel?: string;
}

export function CashbackRuleForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Save",
}: CashbackRuleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(String(initial?.type ?? "percentage"));
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : "");
  const [minOrderAmount, setMinOrderAmount] = useState(
    initial?.minOrderAmount != null ? String(initial.minOrderAmount) : ""
  );
  const [maxCashbackAmount, setMaxCashbackAmount] = useState(
    initial?.maxCashbackAmount != null ? String(initial.maxCashbackAmount) : ""
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const typeOptions = useMemo(
    () => [
      { value: "percentage", label: "Percentage" },
      { value: "fixed", label: "Fixed Amount" },
    ],
    []
  );

  const canSubmit = name.trim().length > 0 && value.trim().length > 0;

  const handleSubmit = async () => {
    await onSubmit({
      name: name.trim(),
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : undefined,
      maxCashbackAmount: maxCashbackAmount.trim() ? Number(maxCashbackAmount) : undefined,
      isActive,
    });
  };

  return (
    <Card className="max-w-3xl">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />

      <Select
        label="Type"
        value={type}
        onChange={(val) => setType(val as string)}
        options={typeOptions}
        search={false}
      />

      <Input
        label={type === "percentage" ? "Value (%)" : "Value"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="number"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Min Order Amount"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          type="number"
        />
        <Input
          label="Max Cashback Amount"
          value={maxCashbackAmount}
          onChange={(e) => setMaxCashbackAmount(e.target.value)}
          type="number"
        />
      </div>

      <Checkbox checked={isActive} onChange={setIsActive} label="Active" />

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
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

"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Card } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Select } from "../../src/components/ui/select";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Button } from "../../src/components/ui/button";
import { EmptyState } from "../../src/components/common/EmptyState";
import { Wallet } from "lucide-react";
import {
  useCashbackRules,
  useUpdateCashbackRule,
} from "../../src/services/cashback-rules/hooks/use-cashback-rules";
import type { CashbackRule, UpdateCashbackRuleDto } from "../../src/services/cashback-rules/types/cashback-rule.types";

function EditCashbackRuleForm({
  rule,
  isSaving,
  onSubmit,
  onCancel,
}: {
  rule: CashbackRule;
  isSaving: boolean;
  onSubmit: (data: UpdateCashbackRuleDto) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(rule.name ?? "");
  const [type, setType] = useState<string>(String(rule.type ?? "percentage"));
  const [value, setValue] = useState<string>(rule.value != null ? String(rule.value) : "");
  const [minOrderAmount, setMinOrderAmount] = useState<string>(
    rule.minOrderAmount != null ? String(rule.minOrderAmount) : ""
  );
  const [maxCashbackAmount, setMaxCashbackAmount] = useState<string>(
    rule.maxCashbackAmount != null ? String(rule.maxCashbackAmount) : ""
  );
  const [isActive, setIsActive] = useState(Boolean(rule.isActive));

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
    <>
      <PageHeader
        icon={<Wallet />}
        title={`Edit Rule #${rule.id}`}
        description="Update cashback rule settings"
        action={{ label: "Save", onClick: handleSubmit, disabled: !canSubmit || isSaving }}
        cancelAction={{ label: "Back", onClick: onCancel, disabled: isSaving }}
      />

      <Card className="p-6 space-y-4 max-w-3xl">
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

        <div className="pt-2">
          <Checkbox checked={isActive} onChange={setIsActive} label="Active" />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
            color="var(--color-primary)"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            color="var(--color-primary2)"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </>
  );
}

export default function EditCashbackRulePage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params]);

  const { data: rules, isLoading, isError, error } = useCashbackRules();
  const updateRule = useUpdateCashbackRule();

  const rule = useMemo(() => {
    const list = Array.isArray(rules) ? rules : [];
    return list.find((r) => r.id === id);
  }, [rules, id]);

  const handleSubmit = async (data: UpdateCashbackRuleDto) => {
    await updateRule.mutateAsync({ id, data });
    router.push("/cashback-rules");
  };

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Wallet />}
          title="Failed to load cashback rule"
          description={(error as any)?.message || "Please try again."}
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push("/cashback-rules")} color="var(--color-primary)">
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoading && !rule) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Wallet />}
          title="Rule not found"
          description="This rule may have been deleted."
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push("/cashback-rules")} color="var(--color-primary)">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {rule ? (
        <EditCashbackRuleForm
          key={rule.id}
          rule={rule}
          isSaving={updateRule.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/cashback-rules")}
        />
      ) : null}
    </div>
  );
}

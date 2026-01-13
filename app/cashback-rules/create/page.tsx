"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Card } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Select } from "../../src/components/ui/select";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Button } from "../../src/components/ui/button";
import { Wallet } from "lucide-react";
import { useCreateCashbackRule } from "../../src/services/cashback-rules/hooks/use-cashback-rules";

export default function CreateCashbackRulePage() {
  const router = useRouter();
  const createRule = useCreateCashbackRule();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("percentage");
  const [value, setValue] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("");
  const [maxCashbackAmount, setMaxCashbackAmount] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const typeOptions = useMemo(
    () => [
      { value: "percentage", label: "Percentage" },
      { value: "fixed", label: "Fixed Amount" },
    ],
    []
  );

  const canSubmit = name.trim().length > 0 && value.trim().length > 0;

  const handleSubmit = async () => {
    const payload = {
      name: name.trim(),
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : undefined,
      maxCashbackAmount: maxCashbackAmount.trim() ? Number(maxCashbackAmount) : undefined,
      isActive,
    };

    await createRule.mutateAsync(payload as any);
    router.push("/cashback-rules");
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Wallet />}
        title="Create Cashback Rule"
        description="Add a new cashback rule"
        action={{ label: "Save", onClick: handleSubmit, disabled: !canSubmit || createRule.isPending }}
        cancelAction={{ label: "Back", onClick: () => router.push("/cashback-rules"), disabled: createRule.isPending }}
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
            disabled={!canSubmit || createRule.isPending}
            color="var(--color-primary)"
          >
            {createRule.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/cashback-rules")}
            disabled={createRule.isPending}
            color="var(--color-primary2)"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

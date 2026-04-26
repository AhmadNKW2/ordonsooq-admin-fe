"use client";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export interface PartnerFormErrors {
  full_name?: string;
  company_name?: string;
  phone_number?: string;
}

interface PartnerFormProps {
  fullName: string;
  companyName: string;
  phoneNumber: string;
  errors?: PartnerFormErrors;
  isLoading: boolean;
  submitLabel: string;
  onFullNameChange: (value: string) => void;
  onCompanyNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PartnerForm({
  fullName,
  companyName,
  phoneNumber,
  errors,
  isLoading,
  submitLabel,
  onFullNameChange,
  onCompanyNameChange,
  onPhoneNumberChange,
  onSubmit,
  onCancel,
}: PartnerFormProps) {
  const canSubmit =
    fullName.trim().length > 0 &&
    companyName.trim().length > 0 &&
    phoneNumber.trim().length > 0;

  return (
    <Card className="max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          error={errors?.full_name}
          placeholder="e.g. Ahmad Khaled"
        />

        <Input
          label="Company Name"
          value={companyName}
          onChange={(event) => onCompanyNameChange(event.target.value)}
          error={errors?.company_name}
          placeholder="e.g. Midas Computer Center"
        />

        <div className="md:col-span-2">
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(event.target.value)}
            error={errors?.phone_number}
            placeholder="e.g. +962790000000"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onSubmit} disabled={!canSubmit || isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
"use client";

/**
 * Create Attribute Page
 * Uses React Hook Form + Zod for validation
 */

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAttribute } from "../../src/services/attributes/hooks/use-attributes";
import { AttributeForm } from "../../src/components/attributes/AttributeForm";
import { AttributeValue } from "../../src/services/attributes/types/attribute.types";
import { attributeSchema, type AttributeFormData } from "../../src/lib/validations/attribute.schema";

export default function CreateAttributePage() {
  const router = useRouter();

  // React Hook Form with Zod
  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      is_color: false,
      is_active: true,
    },
    mode: "onSubmit",
  });

  const { watch, setValue, formState: { errors }, trigger } = form;
  
  // Watch form values
  const nameEn = watch("name_en");
  const nameAr = watch("name_ar");
  const isColor = watch("is_color");
  const isActive = watch("is_active");

  // Local values state (using AttributeValue with temporary negative IDs for new values)
  const [localValues, setLocalValues] = useState<AttributeValue[]>([]);

  const createAttribute = useCreateAttribute();

  const handleNameEnChange = (value: string) => {
    setValue("name_en", value);
    // Clear error on change
    if (errors.name_en) {
      trigger("name_en");
    }
  };

  const handleNameArChange = (value: string) => {
    setValue("name_ar", value);
    // Clear error on change
    if (errors.name_ar) {
      trigger("name_ar");
    }
  };

  const handleSubmit = async () => {
    // Validate with RHF
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    // Convert local values to API format
    const validValues = localValues
      .filter((v) => v.value_en && v.value_ar)
      .map((v, index) => ({
        value_en: v.value_en,
        value_ar: v.value_ar,
        color_code: v.color_code || undefined,
        is_active: true,
      }));

    try {
      await createAttribute.mutateAsync({
        name_en: nameEn,
        name_ar: nameAr,
        is_color: isColor,
        is_active: isActive,
        values: validValues.length > 0 ? validValues : undefined,
      });
      router.push("/attributes");
    } catch (error) {
      console.error("Failed to create attribute:", error);
    }
  };

  return (
    <AttributeForm
      mode="create"
      nameEn={nameEn}
      nameAr={nameAr}
      isColor={isColor}
      isActive={isActive}
      onNameEnChange={handleNameEnChange}
      onNameArChange={handleNameArChange}
      onIsColorChange={(value) => setValue("is_color", value)}
      onIsActiveChange={(value) => setValue("is_active", value)}
      formErrors={{
        name_en: errors.name_en?.message,
        name_ar: errors.name_ar?.message,
      }}
      values={localValues}
      onValuesChange={setLocalValues}
      onSubmit={handleSubmit}
      isSubmitting={createAttribute.isPending}
      submitButtonText="Create Attribute"
    />
  );
}

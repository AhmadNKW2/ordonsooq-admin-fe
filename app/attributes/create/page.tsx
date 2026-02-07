"use client";

/**
 * Create Attribute Page
 * Uses React Hook Form + Zod for validation
 */

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAttribute, useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { AttributeForm } from "../../src/components/attributes/AttributeForm";
import { AttributeValue } from "../../src/services/attributes/types/attribute.types";
import { attributeSchema, type AttributeFormData, type AttributeFormOutput } from "../../src/lib/validations/attribute.schema";

export default function CreateAttributePage() {
  const router = useRouter();

  // React Hook Form with Zod
  const form = useForm<AttributeFormData, any, AttributeFormOutput>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      unit_en: "",
      unit_ar: "",
      parent_id: null,
      parent_value_id: null,
      is_color: false,
      is_active: true,
    },
    mode: "onSubmit",
  });

  const { watch, setValue, formState: { errors }, trigger } = form;
  
  // Watch form values
  const nameEn = watch("name_en");
  const nameAr = watch("name_ar");
  const unitEn = watch("unit_en");
  const unitAr = watch("unit_ar");
  const parentId = watch("parent_id");
  const parentValueId = watch("parent_value_id");
  const isColor = watch("is_color");
  const isActive = watch("is_active");

  // Local values state (using AttributeValue with temporary negative IDs for new values)
  const [localValues, setLocalValues] = useState<AttributeValue[]>([]);

  const createAttribute = useCreateAttribute();
  const { data: attributes = [] } = useAttributes();

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

  const onSubmit = async (data: AttributeFormOutput) => {
    // Convert local values to API format
    const validValues = localValues
      .filter((v) => v.value_en && v.value_ar)
      .map((v, index) => ({
        value_en: v.value_en,
        value_ar: v.value_ar,
        parent_value_id: v.parent_value_id,
        color_code: v.color_code || undefined,
        is_active: true,
      }));

    try {
      await createAttribute.mutateAsync({
        name_en: data.name_en,
        name_ar: data.name_ar,
        unit_en: data.unit_en || undefined,
        unit_ar: data.unit_ar || undefined,
        parent_id: data.parent_id,
        parent_value_id: data.parent_value_id,
        is_color: data.is_color,
        is_active: data.is_active,
        values: validValues.length > 0 ? validValues : undefined,
      });
      router.push("/attributes");
    } catch (error) {
      console.error("Failed to create attribute:", error);
    }
  };

  const handleCreateAttribute = () => {
     form.handleSubmit(onSubmit)();
  };

  return (
    <AttributeForm
      mode="create"
      nameEn={nameEn}
      nameAr={nameAr}
      unitEn={unitEn || ""}
      unitAr={unitAr || ""}
      parentId={parentId?.toString() || ""}
      parentValueId={parentValueId?.toString() || ""}
      isColor={isColor}
      isActive={isActive}
      onNameEnChange={handleNameEnChange}
      onNameArChange={handleNameArChange}
      onUnitEnChange={(val) => setValue("unit_en", val)}
      onUnitArChange={(val) => setValue("unit_ar", val)}
      onParentIdChange={(val) => setValue("parent_id", val)}
      onParentValueIdChange={(val) => setValue("parent_value_id", val)}
      onIsColorChange={(value) => setValue("is_color", value)}
      onIsActiveChange={(value) => setValue("is_active", value)}
      formErrors={{
        name_en: errors.name_en?.message,
        name_ar: errors.name_ar?.message,
      }}
      values={localValues}
      onValuesChange={setLocalValues}
      onSubmit={handleCreateAttribute}
      isSubmitting={createAttribute.isPending}
      submitButtonText="Create Attribute"
      attributes={attributes}
    />
  );
}

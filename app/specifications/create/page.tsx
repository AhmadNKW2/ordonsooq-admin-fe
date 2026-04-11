"use client";

/**
 * Create Specification Page
 * Uses React Hook Form + Zod for validation
 */

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSpecification, useSpecifications } from "../../src/services/specifications/hooks/use-specifications";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { SpecificationForm } from "../../src/components/specifications/SpecificationForm";
import { SpecificationValue } from "../../src/services/specifications/types/specification.types";
import { specificationSchema, type SpecificationFormData, type SpecificationFormOutput } from "../../src/lib/validations/specification.schema";

export default function CreateSpecificationPage() {
  const router = useRouter();

  // React Hook Form with Zod
  const form = useForm<SpecificationFormData, any, SpecificationFormOutput>({
    resolver: zodResolver(specificationSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      unit_en: "",
      unit_ar: "",
      parent_id: null,
      parent_value_id: null,
      for_all_categories: false,
      allow_ai_inference: false,
      category_ids: [],
      is_active: true,
      list_separately: false,
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
  const forAllCategories = watch("for_all_categories");
  const allowAiInference = watch("allow_ai_inference");
  const categoryIds = watch("category_ids") || [];
  const isActive = watch("is_active");
  const listSeparately = watch("list_separately");

  // Local values state (using SpecificationValue with temporary negative IDs for new values)
  const [localValues, setLocalValues] = useState<SpecificationValue[]>([]);

  const createSpecification = useCreateSpecification();
  const { data: specifications = [] } = useSpecifications();
  const { data: categories = [] } = useCategories();

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

  const onSubmit = async (data: SpecificationFormOutput) => {
    // Convert local values to API format
    const validValues = localValues
      .filter((v) => v.value_en && v.value_ar)
      .map((v, index) => ({
        value_en: v.value_en,
        value_ar: v.value_ar,
        parent_value_id: v.parent_value_id,
        sort_order: index,
        is_active: true,
      }));

    try {
      await createSpecification.mutateAsync({
        name_en: data.name_en,
        name_ar: data.name_ar,
        unit_en: data.unit_en || undefined,
        unit_ar: data.unit_ar || undefined,
        parent_id: data.parent_id,
        parent_value_id: data.parent_value_id,
        for_all_categories: data.for_all_categories,
        allow_ai_inference: data.allow_ai_inference,
        category_ids: data.for_all_categories ? [] : data.category_ids,
        is_active: data.is_active,
        list_separately: data.list_separately,
        values: validValues.length > 0 ? validValues : undefined,
      });
      router.push("/specifications");
    } catch (error) {
      console.error("Failed to create specification:", error);
    }
  };

  const handleCreateSpecification = () => {
     form.handleSubmit(onSubmit)();
  };

  return (
    <SpecificationForm
      mode="create"
      nameEn={nameEn}
      nameAr={nameAr}
      unitEn={unitEn || ""}
      unitAr={unitAr || ""}
      parentId={parentId?.toString() || ""}
      parentValueId={parentValueId?.toString() || ""}
      categoryIds={categoryIds.map(String)}
      forAllCategories={!!forAllCategories}
      allowAiInference={!!allowAiInference}
      isActive={!!isActive}
      onNameEnChange={handleNameEnChange}
      onNameArChange={handleNameArChange}
      onUnitEnChange={(val) => setValue("unit_en", val)}
      onUnitArChange={(val) => setValue("unit_ar", val)}
      onParentIdChange={(val) => setValue("parent_id", val ? Number(val) : null)}
      onParentValueIdChange={(val) => setValue("parent_value_id", val ? Number(val) : null)}
      onCategoryIdsChange={(ids) => setValue("category_ids", ids.map(Number))}
      onForAllCategoriesChange={(value) => setValue("for_all_categories", value)}
      onAllowAiInferenceChange={(value) => setValue("allow_ai_inference", value)}
      onIsActiveChange={(value) => setValue("is_active", value)}
      listSeparately={listSeparately}
      onListSeparatelyChange={(value) => setValue("list_separately", value)}
      formErrors={{
        name_en: errors.name_en?.message,
        name_ar: errors.name_ar?.message,
      }}
      values={localValues}
      onValuesChange={setLocalValues}
      onSubmit={handleCreateSpecification}
      isSubmitting={createSpecification.isPending}
      submitButtonText="Create Specification"
      specifications={specifications}
      categories={categories}
    />
  );
}

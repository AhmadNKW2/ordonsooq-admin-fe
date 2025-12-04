"use client";

/**
 * Category Form Component
 * Reusable form for creating and editing categories
 */

import { useRouter } from "next/navigation";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Toggle } from "../ui/toggle";
import { Select } from "../ui/select";
import { ImageUpload, ImageUploadItem } from "../ui/image-upload";
import { PageHeader } from "../common/PageHeader";
import { Folder } from "lucide-react";
import { Category } from "../../services/categories/types/category.types";
import { ProductsTableSection, ProductItem } from "../common/ProductsTableSection";

interface CategoryFormProps {
  mode: "create" | "edit";
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  image: ImageUploadItem | null;
  visible: boolean;
  parentId: number | null;
  product_ids: number[];
  onNameEnChange: (value: string) => void;
  onNameArChange: (value: string) => void;
  onDescriptionEnChange?: (value: string) => void;
  onDescriptionArChange?: (value: string) => void;
  onImageChange: (value: ImageUploadItem | null) => void;
  onVisibleChange: (value: boolean) => void;
  onParentIdChange: (value: number | null) => void;
  onProductIdsChange: (value: number[]) => void;
  formErrors: {
    name_en?: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    image?: string;
  };
  parentCategories?: Category[];
  allProducts?: ProductItem[];
  assignedProducts?: ProductItem[];
  onSubmit: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  mode,
  nameEn,
  nameAr,
  descriptionEn = "",
  descriptionAr = "",
  image,
  visible,
  parentId,
  product_ids,
  onNameEnChange,
  onNameArChange,
  onDescriptionEnChange,
  onDescriptionArChange,
  onImageChange,
  onVisibleChange,
  onParentIdChange,
  onProductIdsChange,
  formErrors,
  parentCategories = [],
  allProducts = [],
  assignedProducts = [],
  onSubmit,
  isSubmitting,
  submitButtonText,
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/categories");
  };

  // Filter to only root categories for parent options
  const availableParents = parentCategories.filter((cat) => !cat.parent_id);

  const parentOptions = [
    ...availableParents.map((cat) => ({
      value: cat.id.toString(),
      label: `${cat.name_en} - ${cat.name_ar}`,
    })),
  ];

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      {/* Header */}
      <PageHeader
        icon={<Folder />}
        title={mode === "create" ? "Create Category" : "Edit Category"}
        description={mode === "create" ? "Add a new product category" : "Update category details"}
        cancelAction={{
          label: "Cancel",
          onClick: handleBack,
          disabled: isSubmitting,
        }}
        action={{
          label: isSubmitting ? "Saving..." : submitButtonText,
          onClick: onSubmit,
          disabled: isSubmitting,
        }}
      />

      {/* Form */}
      <Card>
        <h2 className="text-lg font-semibold">Category Details</h2>

        <div className="grid grid-cols-2 gap-5">
          {/* Name English */}
          <Input
            label="Name (English)"
            value={nameEn}
            onChange={(e) => onNameEnChange(e.target.value)}
            error={formErrors.name_en}
            required
            maxLength={100}
          />

          {/* Name Arabic */}
          <Input
            label="Name (Arabic)"
            value={nameAr}
            onChange={(e) => onNameArChange(e.target.value)}
            error={formErrors.name_ar}
            required
            isRtl
            maxLength={100}
          />

          {/* Description English */}
          {onDescriptionEnChange && (
            <Textarea
              label="Description (English)"
              value={descriptionEn}
              onChange={(e) => onDescriptionEnChange(e.target.value)}
              error={formErrors.description_en}
              rows={3}
              maxLength={500}
            />
          )}

          {/* Description Arabic */}
          {onDescriptionArChange && (
            <Textarea
              label="Description (Arabic)"
              value={descriptionAr}
              onChange={(e) => onDescriptionArChange(e.target.value)}
              error={formErrors.description_ar}
              rows={3}
              isRtl
              maxLength={500}
            />
          )}
          {/* Parent Category */}
          <Select
            label="Parent Category"
            value={parentId?.toString() || ""}
            onChange={(value) => {
              const val = Array.isArray(value) ? value[0] : value;
              onParentIdChange(val ? Number(val) : null);
            }}
            options={parentOptions}
          />

          {/* Visibility Status */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <p className="font-medium">Visibility Status</p>
            <Toggle checked={visible} onChange={onVisibleChange} />
          </div>


        </div>

        {/* Image Upload */}
        <ImageUpload
          label="Category Image"
          value={image ? [image] : []}
          onChange={(items) => onImageChange(items.length > 0 ? items[0] : null)}
          error={formErrors.image}
          isMulti={false}
          accept="image/*"
          placeholder="or drag and drop an image here"
          previewSize="lg"
        />

      </Card>

      {/* Products Section */}
      <Card>
        <ProductsTableSection
          title="Category Products"
          products={assignedProducts}
          onProductsChange={onProductIdsChange}
          emptyMessage="No products in this category"
          editButtonText="Edit Products"
          modalTitle="Manage Category Products"
        />
      </Card>
    </div>
  );
};

"use client";

/**
 * Edit Category Page
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useCategory,
  useUpdateCategory,
} from "../../src/services/categories/hooks/use-categories";
import { CategoryForm } from "../../src/components/categories/CategoryForm";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { ImageUploadItem } from "../../src/components/ui/image-upload";
import { RefreshCw, AlertCircle } from "lucide-react";
import { validateCategoryForm } from "../../src/lib/validations";
import { ProductItem } from "../../src/components/common/ProductsTableSection";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = Number(params.id);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [image, setImage] = useState<ImageUploadItem | null>(null);
  const [visible, setVisible] = useState(true);
  const [parentId, setParentId] = useState<number | null>(null);
  const [product_ids, setProductIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<{
    name_en?: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    image?: string;
  }>({});

  // Get the specific category
  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useCategory(categoryId);

  const updateCategory = useUpdateCategory();

  // Get assigned products from category response
  const assignedProducts: ProductItem[] = useMemo(() => {
    const products = (category as any)?.products || [];
    return products.map((p: any) => ({
      id: p.id,
      name_en: p.name_en,
      name_ar: p.name_ar,
      sku: p.sku,
      primary_image: p.primary_image,
      price: p.price,
      category: p.category ? { name: p.category.name } : null,
      vendor: p.vendor ? { name: p.vendor.name } : null,
    }));
  }, [category]);

  // Initialize form when category loads
  useEffect(() => {
    if (category) {
      setNameEn(category.name_en);
      setNameAr(category.name_ar);
      setDescriptionEn(category.description_en || "");
      setDescriptionAr(category.description_ar || "");
      // Set existing image URL
      if (category.image) {
        setImage({
          id: `existing-${Date.now()}`,
          file: undefined,
          preview: category.image,
          type: "image",
          order: 0,
        });
      } else {
        setImage(null);
      }
      setVisible(category.visible ?? true);
      setParentId(category.parent_id || null);
    }
  }, [category]);

  // Initialize product IDs from category response
  useEffect(() => {
    if (category && (category as any).products) {
      setProductIds((category as any).products.map((p: { id: number }) => p.id));
    }
  }, [category]);

  const validate = () => {
    const result = validateCategoryForm({
      name_en: nameEn,
      name_ar: nameAr,
      description_en: descriptionEn,
      description_ar: descriptionAr,
    });

    if (!result.isValid) {
      setFormErrors(result.errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        data: {
          name_en: nameEn,
          name_ar: nameAr,
          description_en: descriptionEn || undefined,
          description_ar: descriptionAr || undefined,
          visible: visible,
          parent_id: parentId,
          // Only send new file if one was uploaded
          image: image?.file || undefined,
          product_ids: product_ids,
        },
      });
      
      router.push("/categories");
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  // Get available parent categories from the category response (assumes API includes this)
  const availableParents = (category as any)?.availableParents || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="font-medium mt-4">Loading category...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold mt-4">Error Loading Category</h3>
              <p className="mt-2 max-w-md mx-auto">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold mt-4">Category Not Found</h3>
              <p className="mt-2 max-w-md mx-auto">
                The category you're looking for doesn't exist.
              </p>
              <Button onClick={() => router.push("/categories")} className="mt-4">
                Back to Categories
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CategoryForm
      mode="edit"
      nameEn={nameEn}
      nameAr={nameAr}
      descriptionEn={descriptionEn}
      descriptionAr={descriptionAr}
      image={image}
      visible={visible}
      parentId={parentId}
      product_ids={product_ids}
      onNameEnChange={(value) => {
        setNameEn(value);
        if (formErrors.name_en) {
          setFormErrors((prev) => ({ ...prev, name_en: undefined }));
        }
      }}
      onNameArChange={(value) => {
        setNameAr(value);
        if (formErrors.name_ar) {
          setFormErrors((prev) => ({ ...prev, name_ar: undefined }));
        }
      }}
      onDescriptionEnChange={(value) => {
        setDescriptionEn(value);
        if (formErrors.description_en) {
          setFormErrors((prev) => ({ ...prev, description_en: undefined }));
        }
      }}
      onDescriptionArChange={(value) => {
        setDescriptionAr(value);
        if (formErrors.description_ar) {
          setFormErrors((prev) => ({ ...prev, description_ar: undefined }));
        }
      }}
      onImageChange={setImage}
      onVisibleChange={setVisible}
      onParentIdChange={setParentId}
      onProductIdsChange={setProductIds}
      formErrors={formErrors}
      parentCategories={availableParents}
      assignedProducts={assignedProducts}
      onSubmit={handleSubmit}
      isSubmitting={updateCategory.isPending}
      submitButtonText="Save Changes"
    />
  );
}

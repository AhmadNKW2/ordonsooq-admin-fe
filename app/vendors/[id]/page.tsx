"use client";

/**
 * Edit Vendor Page
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useVendor,
  useUpdateVendor,
  useVendorProducts,
} from "../../src/services/vendors/hooks/use-vendors";
import { useProducts } from "../../src/services/products/hooks/use-products";
import { VendorForm } from "../../src/components/vendors/VendorForm";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { ImageUploadItem } from "../../src/components/ui/image-upload";
import { RefreshCw, AlertCircle } from "lucide-react";
import { validateVendorForm } from "../../src/lib/validations";
import { ProductItem } from "../../src/components/common/ProductsTableSection";

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = Number(params.id);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [logo, setLogo] = useState<ImageUploadItem | null>(null);
  const [visible, setVisible] = useState(true);
  const [product_ids, setProductIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<{
    name_en?: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    logo?: string;
  }>({});

  // Get the specific vendor
  const {
    data: vendor,
    isLoading,
    isError,
    error,
    refetch,
  } = useVendor(vendorId);

  const { data: vendorProducts } = useVendorProducts(vendorId);
  const { data: productsData } = useProducts({ limit: 1000 });
  const updateVendor = useUpdateVendor();

  // Transform products for the ProductsTableSection
  const allProducts: ProductItem[] = useMemo(() => {
    return productsData?.data?.data?.map((p) => ({
      id: p.id,
      name_en: p.name_en,
      name_ar: p.name_ar,
      sku: p.sku,
      primary_image: p.primary_image,
      price: p.price,
      category: p.category ? { name: p.category.name } : null,
      vendor: p.vendor ? { name: p.vendor.name } : null,
    })) || [];
  }, [productsData]);

  // Get assigned products
  const assignedProducts: ProductItem[] = useMemo(() => {
    return allProducts.filter((p) => product_ids.includes(p.id));
  }, [allProducts, product_ids]);

  // Initialize form when vendor loads
  useEffect(() => {
    if (vendor) {
      setNameEn(vendor.name_en);
      setNameAr(vendor.name_ar);
      setDescriptionEn(vendor.description_en || "");
      setDescriptionAr(vendor.description_ar || "");
      // Set existing logo URL
      if (vendor.logo) {
        setLogo({
          id: `existing-${Date.now()}`,
          file: undefined,
          preview: vendor.logo,
          type: "image",
          order: 0,
        });
      } else {
        setLogo(null);
      }
      setVisible(vendor.visible ?? true);
    }
  }, [vendor]);

  // Initialize product IDs when vendor products load
  useEffect(() => {
    if (vendorProducts?.products) {
      setProductIds(vendorProducts.products.map((p: { id: number }) => p.id));
    }
  }, [vendorProducts]);

  const validate = () => {
    const result = validateVendorForm({
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
      await updateVendor.mutateAsync({
        id: vendorId,
        data: {
          name_en: nameEn,
          name_ar: nameAr,
          description_en: descriptionEn || undefined,
          description_ar: descriptionAr || undefined,
          visible: visible,
          // Only send new file if one was uploaded
          logo: logo?.file || undefined,
          product_ids: product_ids,
        },
      });
      
      router.push("/vendors");
    } catch (error) {
      console.error("Failed to update vendor:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="font-medium mt-4">Loading vendor...</div>
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
              <h3 className="text-xl font-bold mt-4">Error Loading Vendor</h3>
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

  if (!vendor) {
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
              <h3 className="text-xl font-bold mt-4">Vendor Not Found</h3>
              <p className="mt-2 max-w-md mx-auto">
                The vendor you're looking for doesn't exist.
              </p>
              <Button onClick={() => router.push("/vendors")} className="mt-4">
                Back to Vendors
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <VendorForm
      mode="edit"
      nameEn={nameEn}
      nameAr={nameAr}
      descriptionEn={descriptionEn}
      descriptionAr={descriptionAr}
      logo={logo}
      visible={visible}
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
      onLogoChange={setLogo}
      onVisibleChange={setVisible}
      onProductIdsChange={setProductIds}
      formErrors={formErrors}
      allProducts={allProducts}
      assignedProducts={assignedProducts}
      onSubmit={handleSubmit}
      isSubmitting={updateVendor.isPending}
      submitButtonText="Save Changes"
    />
  );
}

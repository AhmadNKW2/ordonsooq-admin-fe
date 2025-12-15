/**
 * View Product Page
 * Read-only page for viewing product details
 */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { useProduct } from "../../../src/services/products/hooks/use-products";
import { useCategories } from "../../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../../src/services/vendors/hooks/use-vendors";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Badge } from "../../../src/components/ui/badge";
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Edit,
  Package,
  Star,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Grid,
  Calendar
} from "lucide-react";

export default function ViewProductPage() {
  const router = useRouter();
  const params = useParams();
  const product_id = parseInt(params.id as string);

  const { data: productData, isLoading: productLoading, isError: productError, error: productErrorData, refetch: refetchProduct } = useProduct(product_id);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors();

  const product = productData?.data;
  const categories = categoriesData || [];
  const vendors = vendorsData || [];

  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return null;
    return categories.find(cat => cat.id === categoryId)?.name_en || `Category ${categoryId}`;
  };

  const getCategoryNames = (categoryIds?: number[]) => {
    if (!categoryIds || categoryIds.length === 0) return "N/A";
    return categoryIds.map(id => getCategoryName(id)).filter(Boolean).join(", ") || "N/A";
  };

  const getVendorName = (vendorId?: number | null) => {
    if (!vendorId) return "N/A";
    return vendors.find(vendor => vendor.id === vendorId)?.name_en || `Vendor ${vendorId}`;
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (productError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold  mb-2">
                Error Loading Product
              </h3>
              <p className=" mb-6">{(productErrorData as any)?.message || "Failed to load product"}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refetchProduct()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/products")}>
                  Back to Products
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <h3 className="text-xl font-bold  mb-2">Product Not Found</h3>
              <p className=" mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
              <Button onClick={() => router.push("/products")}>
                Back to Products
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bw2 p-8">
      <div className="mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/products")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold ">{product.name_en}</h1>
                <Badge variant={product.is_active ? "success" : "danger"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className=" mt-1">{product.name_ar}</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/products/${product_id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium ">Product ID</label>
              <p className=" font-semibold">#{product.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium ">SKU</label>
              <p className=" font-semibold font-mono">{product.sku || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium ">Categories</label>
              <p className=" font-semibold">{getCategoryNames(product.category_ids || (product.category_id ? [product.category_id] : []))}</p>
            </div>
            <div>
              <label className="text-sm font-medium ">Vendor</label>
              <p className=" font-semibold">{getVendorName(product.vendor_id)}</p>
            </div>
            <div>
              <label className="text-sm font-medium ">Status</label>
              <Badge variant={product.is_active ? "success" : "danger"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Descriptions */}
        {(product.short_description_en || product.short_description_ar || product.long_description_en || product.long_description_ar) && (
          <Card>
            <h2 className="text-xl font-semibold  mb-4">Descriptions</h2>

            {product.short_description_en && (
              <div>
                <label className="text-sm font-medium ">Short Description (English)</label>
                <p className=" mt-1">{product.short_description_en}</p>
              </div>
            )}
            {product.short_description_ar && (
              <div>
                <label className="text-sm font-medium ">Short Description (Arabic)</label>
                <p className=" mt-1 text-right" dir="rtl">{product.short_description_ar}</p>
              </div>
            )}
            {product.long_description_en && (
              <div>
                <label className="text-sm font-medium ">Long Description (English)</label>
                <p className=" mt-1 whitespace-pre-wrap">{product.long_description_en}</p>
              </div>
            )}
            {product.long_description_ar && (
              <div>
                <label className="text-sm font-medium ">Long Description (Arabic)</label>
                <p className=" mt-1 whitespace-pre-wrap text-right" dir="rtl">{product.long_description_ar}</p>
              </div>
            )}
          </Card>
        )}

        {/* Ratings */}
        {(product.average_rating || product.total_ratings) && (
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-r1 bg-primary p-2">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold ">Customer Ratings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium ">Average Rating</label>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <p className="text-2xl font-bold ">
                    {typeof product.average_rating === 'number' 
                      ? product.average_rating.toFixed(1) 
                      : typeof product.average_rating === 'string' 
                        ? parseFloat(product.average_rating).toFixed(1) 
                        : "0.0"}
                  </p>
                  <span className="">out of 5</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium ">Total Ratings</label>
                <p className="text-2xl font-bold  mt-1">
                  {product.total_ratings || 0}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pricing Placeholder */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Pricing Information</h2>
          </div>
          <div className="text-center py-8">
            <p className="">
              Pricing data will be loaded from <code className=" px-2 py-1 rounded text-sm">GET /products/{product_id}/pricing</code>
            </p>
            <p className=" text-sm mt-2">
            </p>
          </div>
        </Card>

        {/* Weight & Dimensions Placeholder */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Weight & Dimensions</h2>
          </div>
          <div className="text-center py-8">
            <p className="">
              Weight data will be loaded from <code className=" px-2 py-1 rounded text-sm">GET /products/{product_id}/weight</code>
            </p>
          </div>
        </Card>

        {/* Media Placeholder */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Product Media</h2>
          </div>
          <div className="text-center py-8">
            <p className="">
              Media files will be loaded from <code className=" px-2 py-1 rounded text-sm">GET /products/{product_id}/media</code>
            </p>
          </div>
        </Card>

        {/* Variants/Stock Placeholder */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <Grid className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Stock & Variants</h2>
          </div>
          <div className="text-center py-8">
            <p className="">
              Stock data will be loaded from <code className=" px-2 py-1 rounded text-sm">GET /products/{product_id}/stock</code>
            </p>
          </div>
        </Card>

        {/* Timestamps */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-r1 bg-primary p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">Timestamps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium ">Created At</label>
              <p className=" font-semibold">{formatDate(product.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium ">Last Updated</label>
              <p className=" font-semibold">{formatDate(product.updated_at)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

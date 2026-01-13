"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../../src/providers/loading-provider";
import { useOrder } from "../../src/services/orders/hooks/use-orders";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { EmptyState } from "../../src/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/ui/table";
import { Receipt, ArrowLeft } from "lucide-react";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { setShowOverlay } = useLoading();

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params]);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrder(id, { enabled: id > 0 });

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Receipt />}
          title="Failed to load order"
          description={(error as any)?.message || "Please try again."}
        />
        <div className="flex justify-center">
          <Button onClick={() => refetch()} color="var(--color-primary)">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Receipt />}
          title="Order not found"
          description="This order may not exist or you may not have access."
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push("/orders")} color="var(--color-primary)">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray((order as any).orderItems)
      ? (order as any).orderItems
      : [];

  const shipping = (order.shippingAddress ?? (order as any).shipping_address ?? (order as any).shipping) as any;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Receipt />}
        title={`Order #${order.id}`}
        description="Order details"
        action={{ label: "Back", onClick: () => router.push("/orders") }}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/orders")} color="var(--color-primary)">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-2">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Status:</span> {String(order.status ?? "-")}</div>
            <div><span className="text-gray-500">Payment:</span> {String(order.paymentMethod ?? "-")}</div>
            <div><span className="text-gray-500">Total:</span> {typeof order.total === "number" ? order.total.toFixed(2) : String((order as any).totalAmount ?? "-")}</div>
            <div><span className="text-gray-500">Created:</span> {String(order.createdAt ?? order.created_at ?? "-")}</div>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <h2 className="text-lg font-semibold">Shipping</h2>
          {shipping ? (
            <div className="text-sm space-y-1">
              <div><span className="text-gray-500">Name:</span> {String(shipping.fullName ?? shipping.full_name ?? "-")}</div>
              <div><span className="text-gray-500">Phone:</span> {String(shipping.phone ?? "-")}</div>
              <div><span className="text-gray-500">Street:</span> {String(shipping.street ?? "-")}</div>
              <div><span className="text-gray-500">City:</span> {String(shipping.city ?? "-")}</div>
              <div><span className="text-gray-500">Country:</span> {String(shipping.country ?? "-")}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No shipping address</div>
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table emptyMessage="No items">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any, idx: number) => (
              <TableRow key={item.id ?? idx}>
                <TableCell>
                  {String(item.product?.name_en ?? item.product?.name ?? item.productName ?? item.productId ?? "-")}
                </TableCell>
                <TableCell>{String(item.variant?.name ?? item.variantId ?? "-")}</TableCell>
                <TableCell>{String(item.quantity ?? "-")}</TableCell>
                <TableCell>
                  {typeof item.price === "number" ? item.price.toFixed(2) : String(item.unitPrice ?? "-")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">Raw payload</h2>
        <pre className="text-xs bg-primary/5 rounded-r2 p-4 overflow-auto">
          {JSON.stringify(order, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

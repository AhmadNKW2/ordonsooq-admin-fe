"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
import { useOrders } from "../src/services/orders/hooks/use-orders";
import type { Order } from "../src/services/orders/types/order.types";
import { PageHeader } from "../src/components/common/PageHeader";
import { Card } from "../src/components/ui/card";
import { Input } from "../src/components/ui/input";
import { EmptyState } from "../src/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import { Badge } from "../src/components/ui/badge";
import { Receipt, RefreshCw } from "lucide-react";
import { Button } from "../src/components/ui/button";

function getOrderDate(order: Order): string {
  const raw = order.createdAt ?? order.created_at;
  if (!raw) return "-";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString();
}

export default function OrdersPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();
  const [search, setSearch] = useState("");

  const { data: orders, isLoading, isError, error, refetch } = useOrders();

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    if (!search.trim()) return list;

    const term = search.trim().toLowerCase();
    return list.filter((o) => {
      const idMatch = String(o.id).includes(term);
      const statusMatch = String(o.status ?? "").toLowerCase().includes(term);
      const paymentMatch = String(o.paymentMethod ?? "").toLowerCase().includes(term);
      return idMatch || statusMatch || paymentMatch;
    });
  }, [orders, search]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Receipt />}
        title="Orders"
        description="View customer orders and inspect details"
        action={{
          label: "Refresh",
          onClick: () => refetch(),
        }}
      />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by id, status, payment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              isSearch
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            color="var(--color-primary)"
            className="h-fit"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {isError ? (
        <div>
          <EmptyState
            icon={<Receipt />}
            title="Failed to load orders"
            description={(error as any)?.message || "Please try again."}
          />
          <div className="flex justify-center">
            <Button onClick={() => refetch()} color="var(--color-primary)">
              Retry
            </Button>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No orders"
          description="No orders found for the current filter."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const itemsCount = Array.isArray(order.items)
                  ? order.items.length
                  : Array.isArray((order as any).orderItems)
                    ? (order as any).orderItems.length
                    : undefined;

                const total =
                  typeof order.total === "number"
                    ? order.total
                    : typeof (order as any).totalAmount === "number"
                      ? (order as any).totalAmount
                      : undefined;

                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-primary/5"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono">#{order.id}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "paid" ? "success" : "default"}>
                        {order.status ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.paymentMethod ?? "-"}</TableCell>
                    <TableCell>{typeof total === "number" ? total.toFixed(2) : "-"}</TableCell>
                    <TableCell>{typeof itemsCount === "number" ? itemsCount : "-"}</TableCell>
                    <TableCell>{getOrderDate(order)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

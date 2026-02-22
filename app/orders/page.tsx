"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
import { useOrders } from "../src/services/orders/hooks/use-orders";
import type { OrderStatus, OrderFilters } from "../src/services/orders/types/order.types";
import { PageHeader } from "../src/components/common/PageHeader";
import { Card } from "../src/components/ui/card";
import { Input } from "../src/components/ui/input";
import { EmptyState } from "../src/components/common/EmptyState";
import { Pagination } from "../src/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import { Badge } from "../src/components/ui/badge";
import { Receipt, RefreshCw, Eye } from "lucide-react";
import { Button } from "../src/components/ui/button";
import { Select } from "../src/components/ui/select";
import { PAGINATION } from "../src/lib/constants";
import { IconButton } from "../src/components/ui/icon-button";

function getOrderDate(dateString?: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleString();
}

function getStatusColor(status: OrderStatus | string): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "completed":
    case "delivered":
    case "shipped":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "cancelled":
    case "refunded":
      return "danger";
    default:
      return "default";
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();
  
  const [queryParams, setQueryParams] = useState<OrderFilters>({
    page: PAGINATION.defaultPage,
    limit: PAGINATION.defaultPageSize,
    search: "",
    status: "",
  });

  // Debounced search
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
        setQueryParams(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: response, isLoading, isError, error, refetch } = useOrders(queryParams);
  const orders = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, limit: pageSize, page: 1 }));
  };

  const statusOptions = [
      { value: "", label: "All Statuses" },
      { value: "pending", label: "Pending" },
      { value: "processing", label: "Processing" },
      { value: "shipped", label: "Shipped" },
      { value: "delivered", label: "Delivered" },
      { value: "cancelled", label: "Cancelled" },
      { value: "refunded", label: "Refunded" },
  ];

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
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              label="Search"
              placeholder="Search by Order ID or User Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              isSearch
            />
          </div>
          <div className="w-full md:w-64">
             <Select
                label="Status"
                options={statusOptions}
                value={queryParams.status as string}
                onChange={(val) => setQueryParams(prev => ({ ...prev, status: val as any, page: 1 }))}
             />
          </div>
          <div className="flex items-end self-end">
            <Button
                variant="outline"
                onClick={() => refetch()}
                className="h-10"
            >
                <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isError ? (
        <div>
          <EmptyState
            icon={<Receipt />}
            title="Failed to load orders"
            description={(error as any)?.message || "Please try again."}
          />
          <div className="flex justify-center mt-4">
            <Button onClick={() => refetch()} >
              Retry
            </Button>
          </div>
        </div>
      ) : orders.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Receipt />}
          title="No orders found"
          description="Try adjusting your filters or search criteria."
        />
      ) : (
        <>
            <Card className="p-0 overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {orders.map((order) => (
                    <TableRow
                        key={order.id}
                        className="hover:bg-gray-50/50"
                    >
                        <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                        <TableCell>{order.user?.email || "Guest"}</TableCell>
                        <TableCell className="font-semibold">{order.totalAmount} JOD</TableCell>
                        <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                            {(order.status || "Unknown").toUpperCase()}
                        </Badge>
                        </TableCell>
                        <TableCell>{getOrderDate(order.created_at || order.createdAt)}</TableCell>
                        <TableCell>
                            <IconButton 
                                onClick={() => router.push(`/orders/${order.id}`)}
                                variant="view"
                                title="View Details"
                            />
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </Card>

            <Pagination
                pagination={{
                    currentPage: meta.page,
                    totalPages: meta.totalPages,
                    pageSize: meta.limit,
                    totalItems: meta.total,
                    hasNextPage: meta.page < meta.totalPages,
                    hasPreviousPage: meta.page > 1
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </>
      )}
    </div>
  );
}

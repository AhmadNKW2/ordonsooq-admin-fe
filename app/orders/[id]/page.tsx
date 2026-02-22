"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../../src/providers/loading-provider";
import { useOrder, useUpdateOrderStatus, useUpdateOrderItemCosts } from "../../src/services/orders/hooks/use-orders";
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
import { Select } from "../../src/components/ui/select";
import { Input } from "../../src/components/ui/input";
import { Badge } from "../../src/components/ui/badge";
import {
    Receipt,
    ArrowLeft,
    User,
    MapPin,
    Truck,
    Calendar,
    Save,
    CreditCard,
    Package,
    Mail,
    Phone,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShoppingBag,
    Printer
} from "lucide-react";
import Image from "next/image";
import { OrderStatus } from "../../src/services/orders/types/order.types";
import { cn } from "../../src/lib/utils";

// --- Utility Components & Helpers ---

const formatCurrency = (amount: number | string) => {
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD' }).format(val);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, "success" | "warning" | "danger" | "default" | "secondary" | "primary"> = {
        completed: "success",
        delivered: "success",
        shipped: "primary",
        processing: "secondary",
        pending: "warning",
        cancelled: "danger",
        refunded: "default",
    };

    const icons: Record<string, React.ReactNode> = {
        completed: <CheckCircle2 className="w-3 h-3 mr-1" />,
        delivered: <CheckCircle2 className="w-3 h-3 mr-1" />,
        shipped: <Truck className="w-3 h-3 mr-1" />,
        processing: <Package className="w-3 h-3 mr-1" />,
        pending: <Clock className="w-3 h-3 mr-1" />,
        cancelled: <AlertCircle className="w-3 h-3 mr-1" />,
        refunded: <Receipt className="w-3 h-3 mr-1" />,
    };

    const normalizedStatus = status?.toLowerCase() || "default";
    const variant = statusMap[normalizedStatus] || "default";

    return (
        <Badge variant={variant as any} className="flex items-center gap-1 w-fit capitalize">
            {icons[normalizedStatus]}
            {status}
        </Badge>
    );
}

// --- Main Page Component ---

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { setShowOverlay } = useLoading();
    const updateStatus = useUpdateOrderStatus();

    const [targetStatus, setTargetStatus] = useState<OrderStatus | "">("");
    const [itemCosts, setItemCosts] = useState<Record<number, string>>({});
    const updateItemCosts = useUpdateOrderItemCosts();

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
        setShowOverlay(isLoading || updateStatus.isPending || updateItemCosts.isPending);
    }, [isLoading, updateStatus.isPending, updateItemCosts.isPending, setShowOverlay]);

    useEffect(() => {
        if (order?.status) {
            setTargetStatus(order.status as OrderStatus);
        }
    }, [order]);

    useEffect(() => {
        if (order?.items) {
            const initial: Record<number, string> = {};
            order.items.forEach((item: any) => {
                initial[item.id] = item.cost != null ? String(item.cost) : "";
            });
            setItemCosts(initial);
        }
    }, [order?.items]);

    const handleStatusUpdate = async () => {
        if (!targetStatus || !order) return;
        try {
            await updateStatus.mutateAsync({ id: order.id, status: targetStatus as OrderStatus });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveCosts = async () => {
        if (!order) return;
        const items = Object.entries(itemCosts)
            .filter(([, val]) => val !== "" && !isNaN(Number(val)))
            .map(([itemId, cost]) => ({ itemId: Number(itemId), cost: Number(cost) }));
        if (items.length === 0) return;
        try {
            await updateItemCosts.mutateAsync({ id: order.id, payload: { items } });
        } catch (e) {
            console.error(e);
        }
    };

    if (isError) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-5">
                <div className="w-full max-w-md">
                    <EmptyState
                        icon={<AlertCircle className="text-red-500 w-12 h-12" />}
                        title="Failed to load order"
                        description={(error as any)?.message || "Please try again."}
                    />
                    <div className="flex justify-center mt-6">
                        <Button onClick={() => refetch()} variant="outline">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order && !isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-5">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Receipt className="w-6 h-6 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h2>
                    <p className="text-gray-500 mb-6">The order you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => router.push("/orders")}>
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    // Safe check for render
    if (!order) return null;

    const items = Array.isArray(order.items) ? order.items : [];
    const shipping = order.shippingAddress || (order as any).shipping || {};
    const user = (order.user || {}) as any;
    const totalAmount = parseFloat(order.totalAmount);

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
        { value: "refunded", label: "Refunded" },
    ];
    const canSaveStatus = targetStatus && targetStatus !== order.status;

    return (
        <div>
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-20 bg-white px-6 py-4 flex items-center justify-between shadow-s2">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/orders")}
                    >
                        Back
                    </Button>
                    <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">Order #{order.id}</h1>
                        <StatusBadge status={order.status} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center items-center gap-5 p-5">

                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    <Card>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
                            <p className="text-xs text-gray-500 mt-1">Paid via {order.paymentMethod || "COD"}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-gray-900">{new Date(order.created_at || new Date()).toLocaleDateString()}</div>
                            <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at || new Date()).toLocaleTimeString()}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                            <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                                <User className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-base font-medium truncate text-gray-900" title={user.email}>{user.name || "Customer"}</div>
                            <p className="text-xs text-gray-500 mt-1 truncate">{user.email || "No email provided"}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium text-gray-500">Items Count</h3>
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <ShoppingBag className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                            <p className="text-xs text-gray-500 mt-1">Total products</p>
                        </div>
                    </Card>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left Column (Main) */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                        {/* Order Items */}
                        <Card>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-gray-500" />
                                    Order Items
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    List of products in this order
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Product</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => {
                                            const productName = item.product?.name_en || item.product?.name_ar || "Unknown Product";
                                            const productImage = item.product?.image || (item.product?.media_groups && Object.values(item.product.media_groups)[0]?.media[0]?.url) || "/placeholder.png";
                                            const itemPrice = parseFloat(String(item.price));
                                            const itemTotal = itemPrice * item.quantity;
                                            const variantParams = item.variant?.attribute_values || {};

                                            return (
                                                <TableRow key={item.id} className="group hover:bg-gray-50/50">
                                                    <TableCell className="align-top py-4">
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                                            <Image
                                                                src={productImage}
                                                                alt={productName}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{productName}</span>
                                                            <span className="text-xs font-mono text-gray-400">SKU: {item.product?.id || "N/A"}</span>
                                                            {Object.keys(variantParams).length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                    {Object.entries(variantParams).map(([key, val]) => (
                                                                        <div key={key} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-gray-700 bg-gray-50">
                                                                            <span className="opacity-60 mr-1 capitalize">{key}:</span> {String(val)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right align-top py-4 font-mono text-gray-600">
                                                        {formatCurrency(itemPrice)}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top py-4">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="0.01"
                                                            value={itemCosts[item.id] ?? ""}
                                                            onChange={(e) =>
                                                                setItemCosts((prev) => ({ ...prev, [item.id]: e.target.value }))
                                                            }
                                                            className="w-24 text-right ml-auto"
                                                            placeholder="0.00"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right align-top py-4 font-mono text-gray-900 font-medium">
                                                        x{item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top py-4 font-mono font-bold text-gray-900">
                                                        {formatCurrency(itemTotal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Totals Section */}
                            <div className="flex items-center justify-between gap-4 px-5">
                                <Button
                                    onClick={handleSaveCosts}
                                    disabled={updateItemCosts.isPending}
                                    variant="solid"
                                >
                                    Save Costs
                                </Button>
                            </div>
                            <div className="bg-primary/5 p-5 flex flex-col items-end gap-2">
                                <div className="w-full max-w-xs space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Shipping</span>
                                        <span>{formatCurrency(0)}</span>
                                    </div>
                                    <div className="my-2 h-px bg-gray-200" />
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                Order Timeline
                            </h3>
                            <div className="relative border-l border-gray-200 ml-3 space-y-8 pl-6 py-2">
                                {/* Example Timeline Item - Updated */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-gray-100 shadow-sm"></span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">Order Updated</span>
                                        <span className="text-xs text-gray-500">{formatDate(order.updated_at)}</span>
                                    </div>
                                </div>
                                {/* Example Timeline Item - Created */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300 border-2 border-white ring-2 ring-gray-100 shadow-sm"></span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">Order Placed</span>
                                        <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="flex flex-col gap-5">

                        {/* Status Management */}
                        <Card>
                            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                                Order Status
                            </h3>
                            <Select
                                label="Update Status"
                                options={statusOptions}
                                value={targetStatus}
                                onChange={(val) => setTargetStatus(val as any)}
                            />
                            <Button
                                className="w-full"
                                onClick={handleStatusUpdate}
                                disabled={!canSaveStatus || updateStatus.isPending}
                            >
                                Update
                            </Button>
                        </Card>

                        {/* Customer Details */}
                        <Card>
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                Customer Details
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border">
                                    {user.name?.[0]?.toUpperCase() || "C"}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-gray-900 truncate">{user.name || "Guest User"}</p>
                                    <p className="text-xs text-gray-500">ID: {user.id || "N/A"}</p>
                                </div>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div className="text-sm overflow-hidden text-ellipsis w-full">
                                        <span className="block text-xs text-gray-500 mb-0.5">Email</span>
                                        <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline block truncate">
                                            {user.email || "N/A"}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div className="text-sm w-full">
                                        <span className="block text-xs text-gray-500 mb-0.5">Phone</span>
                                        <a href={`tel:${user.phone || shipping.phone}`} className="text-blue-600 hover:underline block truncate">
                                            {user.phone || shipping.phone || "N/A"}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Shipping Address */}
                        <Card>
                            <div >
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    Shipping Address
                                </h3>
                            </div>
                            <div>
                                <div className="flex flex-col gap-3 text-sm">
                                    <p className="font-semibold text-gray-900 mb-1">{shipping.fullName || user.name || "N/A"}</p>
                                    <p>{shipping.street}</p>
                                    <p>{shipping.city} {shipping.postalCode}</p>
                                    <p className="font-medium mt-1">{shipping.country}</p>
                                    {shipping.details && (
                                        <p className="mt-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                            Note: {shipping.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Extra Info */}
                        <Card>
                            <div >
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    Payment Information
                                </h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500">Method</span>
                                    <span className="font-medium text-gray-900">{order.paymentMethod || "Cash On Delivery"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500">Status</span>
                                    {/* Assuming payment status mapping */}
                                    <Badge variant={order.status === 'delivered' ? 'success' : 'default'} className="text-xs">
                                        {order.status === 'delivered' ? 'Paid' : 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

/**
 * Banner List Page Component
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    useBanners,
    useDeleteBanner,
    useReorderBanners,
} from "../src/services/banners/hooks/use-banners";
import { ImageIcon, GripVertical, X, Search } from "lucide-react";
import { Card } from "../src/components/ui/card";
import { PageHeader } from "../src/components/common/PageHeader";
import { EmptyState } from "../src/components/common/EmptyState";
import { Badge } from "../src/components/ui/badge";
import { IconButton } from "../src/components/ui/icon-button";
import { Input } from "../src/components/ui/input";
import { Button } from "../src/components/ui/button";
import { Pagination } from "../src/components/ui/pagination";
import { PAGINATION } from "../src/lib/constants";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../src/components/ui/table";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";
import { Banner } from "../src/types/banners/banner.types";
import Image from "next/image";

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    MeasuringStrategy,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Row Component
const SortableRow: React.FC<{
    banner: Banner;
    onEdit: (banner: Banner) => void;
    onDelete: (banner: Banner) => void;
}> = ({ banner, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: banner.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: "transform 250ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? 'relative' : undefined,
    };

    return (

        <TableRow
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'bg-primary/5 shadow-lg ring-2 ring-primary rounded-lg' : ''}
        >
            <TableCell className="w-12 font-mono text-sm text-center">
                {banner.sort_order}
            </TableCell>
            <TableCell className="w-12">
                <div
                    className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-200 inline-flex ${isDragging
                        ? 'bg-primary/20 shadow-sm'
                        : 'hover:bg-primary/10 hover:shadow-sm'
                        }`}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className={`h-5 w-5 transition-colors duration-200 ${isDragging ? 'text-primary' : 'text-primary/50'
                        }`} />
                </div>
            </TableCell>
            <TableCell>
                <div className="relative h-12 w-24 overflow-hidden rounded-md border border-primary/20 bg-muted">
                    {banner.image ? (
                        <Image
                            src={banner.image}
                            alt="Banner Image"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Badge
                    variant={
                        banner.visible ? "success" : "danger"
                    }
                >
                    {banner.visible ? "Visible" : "Hidden"}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <IconButton
                        variant="edit"
                        onClick={() => onEdit(banner)}
                        title="Edit"
                    />
                    <IconButton
                        variant="delete"
                        onClick={() => onDelete(banner)}
                        title="Delete"
                    />
                </div>
            </TableCell>
        </TableRow>
    );
};

export default function BannerListPage() {
    const router = useRouter();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
    const [items, setItems] = useState<Banner[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [queryParams, setQueryParams] = useState<{
        page: number;
        limit: number;
        search: string;
    }>({
        page: PAGINATION.defaultPage,
        limit: PAGINATION.defaultPageSize,
        search: "",
    });

    const { data, isLoading } = useBanners(queryParams);
    const deleteBanner = useDeleteBanner();
    const reorderBanners = useReorderBanners();

    // Update items when data changes
    useEffect(() => {
        if (data?.data) {
            setItems(data.data);
        }
    }, [data]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        const debounce = setTimeout(() => {
            if (value !== queryParams.search) {
                setQueryParams((prev) => ({ ...prev, search: value || "", page: 1 }));
            }
        }, 300);

        return () => clearTimeout(debounce);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setQueryParams({
            page: PAGINATION.defaultPage,
            limit: PAGINATION.defaultPageSize,
            search: "",
        });
    };

    const handlePageChange = (page: number) => {
        setQueryParams((prev) => ({ ...prev, page }));
    };

    const handlePageSizeChange = (pageSize: number) => {
        setQueryParams((prev) => ({ ...prev, limit: pageSize, page: 1 }));
    };

    const hasActiveFilters = queryParams.search !== "";

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Compute new order once, then update state and fire API call outside the setter
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            const bannerIds = newItems.map((item) => item.id);
            reorderBanners.mutate(bannerIds);
        }
    };

    const handleEdit = (banner: Banner) => {
        router.push(`/banners/${banner.id}`);
    };

    const handleDeleteClick = (banner: Banner) => {
        setBannerToDelete(banner);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (bannerToDelete) {
            try {
                await deleteBanner.mutateAsync(bannerToDelete.id);
                setDeleteModalOpen(false);
                setBannerToDelete(null);
            } catch (error) {
                console.error("Failed to delete banner:", error);
            }
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col justify-center items-center gap-5 p-5">
            <PageHeader
                title="Banners"
                description="Manage your website banners"
                icon={<ImageIcon />}
                action={{
                    label: "Add Banner",
                    onClick: () => router.push("/banners/create"),
                }}
            />

            {/* Filters */}
            {(items.length > 0 || hasActiveFilters) && (
                <Card>
                    <h2 className="text-lg font-semibold mb-4">Filters</h2>
                    <div className="flex items-center gap-5">
                        <div className="relative flex-1 max-w-sm">
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                label="Search"
                                variant="search"
                            />
                        </div>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={handleClearFilters}
                                className="h-9"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {items.length === 0 && !hasActiveFilters ? (
                <EmptyState
                    title="No banners found"
                    description="Get started by creating your first banner."
                    icon={<ImageIcon />}
                />
            ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        measuring={{
                            droppable: {
                                strategy: MeasuringStrategy.Always,
                            },
                        }}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow isHeader>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead className="w-12">&nbsp;</TableHead>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={items.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.map((banner) => (
                                        <SortableRow
                                            key={banner.id}
                                            banner={banner}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                        />
                                    ))}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
            )}

            {/* Pagination */}
            {items.length > 0 && data?.meta && (
                <Pagination
                    pagination={{
                        currentPage: data.meta.page,
                        pageSize: data.meta.limit,
                        totalItems: data.meta.total,
                        totalPages: data.meta.totalPages,
                        hasNextPage: data.meta.page < data.meta.totalPages,
                        hasPreviousPage: data.meta.page > 1,
                    }}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    showPageSize={true}
                />
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Banner"
                message={`Are you sure you want to delete this banner? This action cannot be undone.`}
                isLoading={deleteBanner.isPending}
            />
        </div>
    );
};

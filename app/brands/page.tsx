"use client";

/**
 * Brands Page
 * Main page component for displaying and managing brands (mirrors vendors page)
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import {
  useBrands,
  useArchiveBrand,
  useReorderBrands,
} from "../src/services/brands/hooks/use-brands";
import { Tags, RefreshCw, AlertCircle, X, GripVertical } from "lucide-react";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { PageHeader } from "../src/components/common/PageHeader";
import { EmptyState } from "../src/components/common/EmptyState";
import { Input } from "../src/components/ui/input";
import { Badge } from "../src/components/ui/badge";
import { IconButton } from "../src/components/ui/icon-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";
import { BrandViewModal } from "../src/components/brands/BrandViewModal";
import { Brand } from "../src/services/brands/types/brand.types";

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

interface SortableBrandRowProps {
  brand: Brand;
  displayIndex: number;
  onView: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

const SortableBrandRow: React.FC<SortableBrandRowProps> = ({
  brand,
  displayIndex,
  onView,
  onEdit,
  onDelete,
}) => {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: brand.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 250ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease",
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-primary/5 shadow-lg ring-2 ring-primary" : ""}
    >
      <TableCell>
        <div
          className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-200 inline-flex ${
            isDragging
              ? "bg-primary/20 shadow-sm"
              : "hover:bg-primary/10 hover:shadow-sm"
          }`}
          {...dndAttributes}
          {...listeners}
        >
          <GripVertical
            className={`h-5 w-5 transition-colors duration-200 ${
              isDragging ? "text-primary" : "text-primary/50"
            }`}
          />
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-gray-500 w-12 text-center">
        {displayIndex}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-start">
          {brand.logo ? (
            <img
              src={brand.logo}
              alt={brand.name_en}
              className="w-12 h-12 rounded-lg object-cover border border-primary/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Tags className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="font-medium">{brand.name_en}</span>
      </TableCell>
      <TableCell>
        <span dir="rtl">{brand.name_ar}</span>
      </TableCell>
      <TableCell>
        <Badge variant={brand.visible ? "success" : "danger"}>
          {brand.visible ? "Visible" : "Hidden"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <IconButton
            variant="view"
            onClick={(e) => {
              e.stopPropagation();
              onView(brand);
            }}
            title="View brand"
          />
          <IconButton
            variant="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(brand);
            }}
            title="Edit brand"
          />
          <IconButton
            variant="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(brand);
            }}
            title="Archive brand"
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function BrandsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [brandToView, setBrandToView] = useState<Brand | null>(null);

  const { data: brands, isLoading, isError, error, refetch } = useBrands();
  const archiveBrand = useArchiveBrand();
  const reorderBrands = useReorderBrands();

  const [orderedBrands, setOrderedBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (brands && Array.isArray(brands)) {
      setOrderedBrands(brands);
    }
  }, [brands]);

  const filteredBrands = useMemo(() => {
    if (!orderedBrands || !Array.isArray(orderedBrands)) return [];
    if (!searchTerm) return orderedBrands;

    const term = searchTerm.toLowerCase();
    return orderedBrands.filter(
      (brand) =>
        brand.name_en.toLowerCase().includes(term) ||
        brand.name_ar.includes(searchTerm) ||
        brand.id.toString().includes(term)
    );
  }, [orderedBrands, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedBrands.findIndex((b) => b.id === active.id);
      const newIndex = orderedBrands.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedBrands, oldIndex, newIndex);
        setOrderedBrands(newOrder);

        const reorderData = newOrder.map((brand, index) => ({
          id: brand.id,
          sort_order: index,
        }));
        reorderBrands.mutate({ brands: reorderData });
      }
    }
  }, [orderedBrands, reorderBrands]);

  const handleView = (brand: Brand) => {
    setBrandToView(brand);
    setViewModalOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    router.push(`/brands/${brand.id}`);
  };

  const handleViewEdit = () => {
    if (brandToView) {
      setViewModalOpen(false);
      router.push(`/brands/${brandToView.id}`);
    }
  };

  const handleDeleteClick = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (brandToDelete) {
      try {
        await archiveBrand.mutateAsync(brandToDelete.id);
        setDeleteModalOpen(false);
        setBrandToDelete(null);
      } catch (err) {
        console.error("Failed to archive brand:", err);
      }
    }
  };

  const handleCreateNew = () => {
    router.push("/brands/create");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
  };

  const hasActiveFilters = !!searchTerm;

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
              <h3 className="text-xl font-bold mt-4">Error Loading Brands</h3>
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

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<Tags />}
        title="Brands"
        description="Manage your product brands"
        action={{ label: "Create", onClick: handleCreateNew }}
      />

      {(filteredBrands.length > 0 || hasActiveFilters) && (
        <Card>
          <h2 className="text-lg font-semibold">Filters</h2>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="font-medium mt-4">Loading brands...</div>
        </div>
      ) : filteredBrands.length === 0 ? (
        <EmptyState
          icon={<Tags />}
          title="No brands found"
          description="Try adjusting your filters or add new brands"
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
          <SortableContext
            items={filteredBrands.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow isHeader>
                  <TableHead className="w-12"> </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Arabic)</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand, index) => (
                  <SortableBrandRow
                    key={brand.id}
                    brand={brand}
                    displayIndex={index + 1}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Archive Brand"
        message="Are you sure you want to archive this brand?"
        isLoading={archiveBrand.isPending}
      />

      <BrandViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        brand={brandToView}
        onEdit={handleViewEdit}
      />
    </div>
  );
}

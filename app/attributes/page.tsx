"use client";

/**
 * Attributes Page
 * Main page component for displaying and managing attributes
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
import {
  useAttributes,
  useDeleteAttribute,
  useReorderAttributes,
} from "../src/services/attributes/hooks/use-attributes";
import { Tag, RefreshCw, AlertCircle, X, GripVertical } from "lucide-react";
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
import { AttributeViewModal } from "../src/components/attributes/AttributeViewModal";
import { Attribute } from "../src/services/attributes/types/attribute.types";

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
  attribute: Attribute;
  displayIndex: number;
  onView: (attribute: Attribute) => void;
  onEdit: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
}> = ({ attribute, displayIndex, onView, onEdit, onDelete }) => {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attribute.id });

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
      <TableCell className="w-12">
        <div
          className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-200 inline-flex ${
            isDragging 
              ? 'bg-primary/20 shadow-sm' 
              : 'hover:bg-primary/10 hover:shadow-sm'
          }`}
          {...dndAttributes}
          {...listeners}
        >
          <GripVertical className={`h-5 w-5 transition-colors duration-200 ${
            isDragging ? 'text-primary' : 'text-primary/50'
          }`} />
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-gray-500">{displayIndex}</TableCell>
      <TableCell className="font-semibold">
        <div className="flex items-center gap-2">
          {attribute.is_color && (
            <div className="flex items-center gap-1">
              {attribute.values && attribute.values.length > 0 ? (
                attribute.values.slice(0, 4).map((value) => (
                  <div
                    key={value.id}
                    className="w-6 h-6 rounded-full shadow-s2 border border-black/30"
                    style={{ backgroundColor: value.color_code || '#ccc' }}
                    title={value.value_en}
                  />
                ))
              ) : (
                <div
                  className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300"
                  title="Color attribute"
                />
              )}
              {attribute.values && attribute.values.length > 4 && (
                <span className="text-xs text-gray-500">+{attribute.values.length - 4}</span>
              )}
            </div>
          )}
          <div className="flex flex-col">
            <span>{attribute.name_en}</span>
            <span className="text-sm text-gray-500">
              {attribute.name_ar}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={attribute.is_active ? "success" : "danger"}>
          {attribute.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <IconButton
            variant="view"
            onClick={(e) => {
              e.stopPropagation();
              onView(attribute);
            }}
            title="View attribute"
          />
          <IconButton
            variant="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(attribute);
            }}
            title="Edit attribute"
          />
          <IconButton
            variant="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(attribute);
            }}
            title="Delete attribute"
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function AttributesPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(
    null
  );
  const [attributeToView, setAttributeToView] = useState<Attribute | null>(
    null
  );

  const { data: attributes, isLoading, isError, error, refetch } = useAttributes();
  const deleteAttribute = useDeleteAttribute();

  // Show loading overlay while data is loading
  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);
  const reorderAttributes = useReorderAttributes();

  // DnD sensors
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

  // Sort attributes by sort_order
  const sortedAttributes = useMemo(() => {
    if (!attributes || !Array.isArray(attributes)) return [];
    return [...attributes].sort((a, b) => a.sort_order - b.sort_order);
  }, [attributes]);

  // Filter attributes based on search
  const filteredAttributes = useMemo(() => {
    if (!searchTerm) return sortedAttributes;
    const term = searchTerm.toLowerCase();
    return sortedAttributes.filter(
      (attr) =>
        attr.name_en.toLowerCase().includes(term) ||
        attr.name_ar.includes(searchTerm)
    );
  }, [sortedAttributes, searchTerm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredAttributes.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = filteredAttributes.findIndex(
        (item) => item.id === over.id
      );

      const newOrder = arrayMove(filteredAttributes, oldIndex, newIndex);
      const orders = newOrder.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      reorderAttributes.mutate(orders);
    }
  };

  const handleView = (attribute: Attribute) => {
    setAttributeToView(attribute);
    setViewModalOpen(true);
  };

  const handleEdit = (attribute: Attribute) => {
    router.push(`/attributes/${attribute.id}`);
  };

  const handleViewEdit = () => {
    if (attributeToView) {
      setViewModalOpen(false);
      router.push(`/attributes/${attributeToView.id}`);
    }
  };

  const handleDeleteClick = (attribute: Attribute) => {
    setAttributeToDelete(attribute);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (attributeToDelete) {
      try {
        await deleteAttribute.mutateAsync(attributeToDelete.id);
        setDeleteModalOpen(false);
        setAttributeToDelete(null);
      } catch (error) {
        console.error("Failed to delete attribute:", error);
      }
    }
  };

  const handleCreateNew = () => {
    router.push("/attributes/create");
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
              <h3 className="text-xl font-bold ">Error Loading Attributes</h3>
              <p className=" max-w-md mx-auto">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
              <Button onClick={() => refetch()}>
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
        icon={<Tag />}
        title="Attributes"
        description="Manage your product attributes"
        action={{ label: "Create", onClick: handleCreateNew }}
      />

      {/* Filters */}
      {(filteredAttributes.length > 0 || hasActiveFilters) && (
        <Card>
          <h2 className="text-lg font-semibold ">Filters</h2>
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

      {/* Attributes Table */}
      {!isLoading && filteredAttributes.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title="No attributes found"
          description="Try adjusting your filters or add new attributes"
        />
      ) : !isLoading && (
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
                <TableHead className="w-12">{""}</TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead >Attribute Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredAttributes.map((attr) => attr.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredAttributes.map((attribute, index) => (
                  <SortableRow
                    key={attribute.id}
                    attribute={attribute}
                    displayIndex={index + 1}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAttributeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Attribute"
        itemName={attributeToDelete?.name_en}
        isLoading={deleteAttribute.isPending}
      />

      {/* Attribute View Modal */}
      <AttributeViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setAttributeToView(null);
        }}
        attribute={attributeToView}
        onEdit={handleViewEdit}
      />
    </div>
  );
}

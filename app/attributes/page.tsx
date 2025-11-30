"use client";

/**
 * Attributes Page
 * Main page component for displaying and managing attributes
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useAttributes,
  useDeleteAttribute,
  useReorderAttributes,
} from "../src/services/attributes/hooks/use-attributes";
import { Tag, RefreshCw, AlertCircle, X, GripVertical } from "lucide-react";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
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
  onView: (attribute: Attribute) => void;
  onEdit: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
}> = ({ attribute, onView, onEdit, onDelete }) => {
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
    transition: transition || 'transform 200ms ease, box-shadow 200ms ease',
    opacity: isDragging ? 1 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
    boxShadow: isDragging ? '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)' : undefined,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style}
      className={isDragging ? 'bg-primary/5 scale-[1.02] rounded-lg' : ''}
    >
      <TableCell className="w-12">
        <button
          className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-200 ${
            isDragging 
              ? 'bg-primary/20 shadow-sm' 
              : 'hover:bg-primary/10 hover:shadow-sm'
          }`}
          {...dndAttributes}
          {...listeners}
        >
          <GripVertical className={`h-5 w-5 transition-colors duration-200 ${
            isDragging ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
          }`} />
        </button>
      </TableCell>
      <TableCell className="font-mono text-sm">{attribute.id}</TableCell>
      <TableCell className="font-semibold">
        <div className="flex flex-col">
          <span>{attribute.name_en}</span>
          <span className="text-sm text-gray-500">
            {attribute.name_ar}
          </span>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(
    null
  );

  const { data: attributes, isLoading, isError, error, refetch } = useAttributes();
  const deleteAttribute = useDeleteAttribute();
  const reorderAttributes = useReorderAttributes();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
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
    router.push(`/attributes/${attribute.id}`);
  };

  const handleEdit = (attribute: Attribute) => {
    router.push(`/attributes/${attribute.id}`);
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
      {/* Header */}
      <div className="w-full justify-between items-center flex gap-5">
        <div className="flex items-center gap-5">
          <div className="rounded-r1 bg-primary to-primary p-3">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
            <p className=" mt-1">Manage your product attributes</p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>Create</Button>
      </div>

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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className=" font-medium mt-4">Loading attributes...</div>
        </div>
      ) : filteredAttributes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className=" font-medium text-lg">No attributes found</div>
          <div className=" text-sm">
            Try adjusting your filters or add new attributes
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableHead className="w-12">{""}</TableHead>
                <TableHead>ID</TableHead>
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
                {filteredAttributes.map((attribute) => (
                  <SortableRow
                    key={attribute.id}
                    attribute={attribute}
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
        message={`Are you sure you want to delete "${attributeToDelete?.name_en}"? This action cannot be undone.`}
        itemName={attributeToDelete?.name_en}
        isLoading={deleteAttribute.isPending}
      />
    </div>
  );
}

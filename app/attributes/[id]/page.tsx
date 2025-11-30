"use client";

/**
 * Attribute Edit Page
 * Page for editing an attribute and its values
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useAttribute,
  useUpdateAttribute,
  useAddAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
  useReorderAttributeValues,
} from "../../src/services/attributes/hooks/use-attributes";
import {
  Tag,
  RefreshCw,
  AlertCircle,
  GripVertical,
  Plus,
  Check,
  X,
  ArrowLeft,
  Palette,
} from "lucide-react";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Toggle } from "../../src/components/ui/toggle";
import { IconButton } from "../../src/components/ui/icon-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/ui/table";
import { DeleteConfirmationModal } from "../../src/components/common/DeleteConfirmationModal";
import { AttributeValue } from "../../src/services/attributes/types/attribute.types";

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

// Color Picker Component
const ColorPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ value, onChange, onClose }) => {
  const [hexValue, setHexValue] = useState(value || "#000000");

  const handleSubmit = () => {
    onChange(hexValue);
    onClose();
  };

  return (
    <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white rounded-r1 shadow-lg border border-primary/20">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => setHexValue(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer border-0"
          />
          <Input
            value={hexValue}
            onChange={(e) => setHexValue(e.target.value)}
            placeholder="#000000"
            className="w-32"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>
            Apply
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sortable Value Row Component
const SortableValueRow: React.FC<{
  value: AttributeValue;
  isColor: boolean;
  editingValueId: number | null;
  editFormData: { value_en: string; value_ar: string; color_code: string };
  onEdit: (value: AttributeValue) => void;
  onDelete: (value: AttributeValue) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditFormChange: (field: string, val: string) => void;
}> = ({
  value,
  isColor,
  editingValueId,
  editFormData,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
}) => {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const [showColorPicker, setShowColorPicker] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease, box-shadow 200ms ease',
    opacity: isDragging ? 1 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
    boxShadow: isDragging ? '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)' : undefined,
  };

  const isEditing = editingValueId === value.id;

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
      <TableCell className="font-mono text-sm">{value.id}</TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editFormData.value_en}
            onChange={(e) => onEditFormChange("value_en", e.target.value)}
            placeholder="Name (EN)"
            className="w-full"
          />
        ) : (
          <span>{value.value_en}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editFormData.value_ar}
            onChange={(e) => onEditFormChange("value_ar", e.target.value)}
            placeholder="Name (AR)"
            className="w-full"
            dir="rtl"
          />
        ) : (
          <span dir="rtl">{value.value_ar}</span>
        )}
      </TableCell>
      {isColor && (
        <TableCell>
          {isEditing ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: editFormData.color_code || "#ccc" }}
                />
                <Button
                  variant="outline"
                  isSquare
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </div>
              {showColorPicker && (
                <ColorPicker
                  value={editFormData.color_code}
                  onChange={(val) => onEditFormChange("color_code", val)}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>
          ) : value.color_code ? (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: value.color_code }}
              />
              <span className="text-sm text-gray-500">{value.color_code}</span>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <IconButton
                variant="check"
                onClick={onSaveEdit}
                title="Save"
              />
              <IconButton
                variant="cancel"
                onClick={onCancelEdit}
                title="Cancel"
              />
            </>
          ) : (
            <>
              <IconButton
                variant="edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(value);
                }}
                title="Edit value"
              />
              <IconButton
                variant="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(value);
                }}
                title="Delete value"
              />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function AttributeEditPage() {
  const router = useRouter();
  const params = useParams();
  const attributeId = Number(params.id);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isColor, setIsColor] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // New value form state
  const [newValueEn, setNewValueEn] = useState("");
  const [newValueAr, setNewValueAr] = useState("");
  const [newColorCode, setNewColorCode] = useState("");
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);

  // Edit value state
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    value_en: "",
    value_ar: "",
    color_code: "",
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<AttributeValue | null>(
    null
  );

  // Queries and mutations
  const { data: attribute, isLoading, isError, error, refetch } = useAttribute(
    attributeId,
    { enabled: !!attributeId }
  );
  const updateAttribute = useUpdateAttribute();
  const addValue = useAddAttributeValue();
  const updateValue = useUpdateAttributeValue();
  const deleteValue = useDeleteAttributeValue();
  const reorderValues = useReorderAttributeValues();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form when attribute loads
  useEffect(() => {
    if (attribute) {
      setNameEn(attribute.name_en);
      setNameAr(attribute.name_ar);
      setIsActive(attribute.is_active);
      // Determine if this is a color attribute based on existing values having color_code
      const hasColorCodes = attribute.values?.some((v: AttributeValue) => v.color_code);
      setIsColor(!!hasColorCodes);
    }
  }, [attribute]);

  // Sort values by sort_order
  const sortedValues = useMemo(() => {
    if (!attribute?.values) return [];
    return [...attribute.values].sort((a, b) => a.sort_order - b.sort_order);
  }, [attribute?.values]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedValues.findIndex((item) => item.id === active.id);
      const newIndex = sortedValues.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(sortedValues, oldIndex, newIndex);
      const orders = newOrder.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      reorderValues.mutate({ orders, attributeId });
    }
  };

  const handleSaveAttribute = async () => {
    if (!nameEn.trim() || !nameAr.trim()) {
      alert('Name (English) and Name (Arabic) are required');
      return;
    }
    
    try {
      await updateAttribute.mutateAsync({
        id: attributeId,
        data: {
          name_en: nameEn,
          name_ar: nameAr,
          is_active: isActive,
        },
      });
    } catch (error) {
      console.error("Failed to update attribute:", error);
    }
  };

  const handleAddValue = async () => {
    if (!newValueEn.trim() || !newValueAr.trim()) {
      alert('Value (English) and Value (Arabic) are required');
      return;
    }
    
    if (isColor && !newColorCode.trim()) {
      alert('Color code is required for color attributes');
      return;
    }

    try {
      await addValue.mutateAsync({
        attributeId,
        data: {
          value_en: newValueEn,
          value_ar: newValueAr,
          color_code: isColor ? newColorCode || null : null,
        },
      });
      setNewValueEn("");
      setNewValueAr("");
      setNewColorCode("");
    } catch (error) {
      console.error("Failed to add value:", error);
    }
  };

  const handleEditValue = (value: AttributeValue) => {
    setEditingValueId(value.id);
    setEditFormData({
      value_en: value.value_en,
      value_ar: value.value_ar,
      color_code: value.color_code || "",
    });
  };

  const handleSaveEditValue = async () => {
    if (!editingValueId) return;
    
    if (!editFormData.value_en.trim() || !editFormData.value_ar.trim()) {
      alert('Value (English) and Value (Arabic) are required');
      return;
    }
    
    if (isColor && !editFormData.color_code.trim()) {
      alert('Color code is required for color attributes');
      return;
    }

    try {
      await updateValue.mutateAsync({
        valueId: editingValueId,
        data: {
          value_en: editFormData.value_en,
          value_ar: editFormData.value_ar,
          color_code: isColor ? editFormData.color_code || null : null,
        },
        attributeId,
      });
      setEditingValueId(null);
      setEditFormData({ value_en: "", value_ar: "", color_code: "" });
    } catch (error) {
      console.error("Failed to update value:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingValueId(null);
    setEditFormData({ value_en: "", value_ar: "", color_code: "" });
  };

  const handleDeleteClick = (value: AttributeValue) => {
    setValueToDelete(value);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (valueToDelete) {
      try {
        await deleteValue.mutateAsync({
          valueId: valueToDelete.id,
          attributeId,
        });
        setDeleteModalOpen(false);
        setValueToDelete(null);
      } catch (error) {
        console.error("Failed to delete value:", error);
      }
    }
  };

  const handleEditFormChange = (field: string, val: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: val }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="font-medium mt-4">Loading attribute...</div>
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
              <h3 className="text-xl font-bold">Error Loading Attribute</h3>
              <p className="max-w-md mx-auto">
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
          <Button variant="outline" onClick={() => router.push("/attributes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="rounded-r1 bg-primary to-primary p-3">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Attribute</h1>
            <p className="mt-1">Manage attribute details and values</p>
          </div>
        </div>
        <Button
          onClick={handleSaveAttribute}
          disabled={updateAttribute.isPending}
        >
          {updateAttribute.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Attribute Form */}
      <Card className="w-full">
        <h2 className="text-lg font-semibold">Attribute Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Name (English) *"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Enter name in English"
            required
          />
          <Input
            label="Name (Arabic) *"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="Enter name in Arabic"
            dir="rtl"
            required
          />
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Toggle checked={isColor} onChange={setIsColor} />
            <span className="text-sm font-medium">Is Color Attribute</span>
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={isActive} onChange={setIsActive} />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>

        {/* Color Input Section (only show if isColor is true) */}
        {isColor && (
          <div className="p-4 bg-primary/5 rounded-r1 border border-primary/20">
            <p className="text-sm text-gray-600 mb-2">
              This attribute will support color codes for each value. You can set
              colors when adding or editing values.
            </p>
          </div>
        )}
      </Card>

      {/* Add New Value */}
      <Card className="w-full">
        <h2 className="text-lg font-semibold">Add New Value</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Value (English) *"
              value={newValueEn}
              onChange={(e) => setNewValueEn(e.target.value)}
              placeholder="Enter value in English"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Value (Arabic) *"
              value={newValueAr}
              onChange={(e) => setNewValueAr(e.target.value)}
              placeholder="Enter value in Arabic"
              dir="rtl"
              required
            />
          </div>
          {isColor && (
            <div className="relative">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: newColorCode || "#ccc" }}
                  onClick={() => setShowNewColorPicker(!showNewColorPicker)}
                />
                <Button
                  variant="outline"
                  isSquare
                  onClick={() => setShowNewColorPicker(!showNewColorPicker)}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </div>
              {showNewColorPicker && (
                <ColorPicker
                  value={newColorCode}
                  onChange={setNewColorCode}
                  onClose={() => setShowNewColorPicker(false)}
                />
              )}
            </div>
          )}
          <Button onClick={handleAddValue} disabled={addValue.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {addValue.isPending ? "Adding..." : "Add Value"}
          </Button>
        </div>
      </Card>

      {/* Attribute Values Table */}
      <Card className="w-full">
        <h2 className="text-lg font-semibold">Attribute Values</h2>
        {sortedValues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="font-medium text-lg">No values yet</div>
            <div className="text-sm text-gray-500">
              Add values using the form above
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
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (AR)</TableHead>
                  {isColor && <TableHead>Color</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={sortedValues.map((v) => v.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedValues.map((value) => (
                    <SortableValueRow
                      key={value.id}
                      value={value}
                      isColor={isColor}
                      editingValueId={editingValueId}
                      editFormData={editFormData}
                      onEdit={handleEditValue}
                      onDelete={handleDeleteClick}
                      onSaveEdit={handleSaveEditValue}
                      onCancelEdit={handleCancelEdit}
                      onEditFormChange={handleEditFormChange}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setValueToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Value"
        message={`Are you sure you want to delete "${valueToDelete?.value_en}"? This action cannot be undone.`}
        itemName={valueToDelete?.value_en}
        isLoading={deleteValue.isPending}
      />
    </div>
  );
}

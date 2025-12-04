"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { IconButton } from "../ui/icon-button";
import { Folder, Package, GripVertical } from "lucide-react";
import { Category } from "../../services/categories/types/category.types";

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
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

interface ReorderItem {
  id: number;
  sortOrder: number;
  parentId: number | null;
}

interface CategoryAccordionProps {
  categories: Category[];
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onReorder?: (reorderedCategories: ReorderItem[]) => void;
}

// ============================================
// Sortable Parent Category Item
// ============================================
interface SortableParentCategoryProps {
  category: Category;
  displayIndex: number;
  children: Category[];
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onSubcategoryReorder: (parentId: number, reordered: Category[]) => void;
  isDraggingParent: boolean;
  canDrag: boolean;
}

const SortableParentCategory: React.FC<SortableParentCategoryProps> = ({
  category,
  displayIndex,
  children,
  onView,
  onEdit,
  onDelete,
  onSubcategoryReorder,
  isDraggingParent,
  canDrag,
}) => {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `parent-${category.id}`,
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 250ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease",
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = children.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem
        value={category.id.toString()}
        className={`border border-primary/20 rounded-lg mb-2 px-4 bg-white shadow-sm transition-all duration-200 ${
          isDragging ? "ring-2 ring-primary shadow-lg" : ""
        }`}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 w-full">
            {/* Drag Handle */}
            <div
              className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all duration-200 ${
                isDragging
                  ? "bg-primary/20 shadow-sm"
                  : "hover:bg-primary/10 hover:shadow-sm"
              }`}
              {...dndAttributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical
                className={`h-5 w-5 transition-colors duration-200 ${
                  isDragging ? "text-primary" : "text-primary/50"
                }`}
              />
            </div>

            {/* Display Index */}
            <div className="w-8 text-center font-mono text-sm text-gray-500">
              {displayIndex}
            </div>

            <div className="flex items-center gap-3 flex-1">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name_en}
                  className="w-12 h-12 rounded-lg object-cover border border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="font-semibold text-gray-900">
                  {category.name_en}
                </span>
                <span className="text-sm text-gray-500">{category.name_ar}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Badge variant="secondary">{children.length} subcategories</Badge>
              )}
              <Badge variant={category.visible ? "success" : "danger"}>
                {category.visible ? "Visible" : "Hidden"}
              </Badge>
            </div>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <IconButton
                variant="view"
                asDiv
                onClick={(e) => {
                  e.stopPropagation();
                  onView(category);
                }}
                title="View category"
              />
              <IconButton
                variant="edit"
                asDiv
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
                title="Edit category"
              />
              <IconButton
                variant="delete"
                asDiv
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                title="Delete category"
              />
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          {hasChildren ? (
            <SubcategoryList
              parentId={category.id}
              parentIndex={displayIndex}
              subcategories={children}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={(reordered) => onSubcategoryReorder(category.id, reordered)}
              isDraggingParent={isDraggingParent}
            />
          ) : (
            <div className="text-sm text-gray-500 pl-4 py-2">
              No subcategories
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

// ============================================
// Subcategory List with its own DnD context
// ============================================
interface SubcategoryListProps {
  parentId: number;
  parentIndex: number;
  subcategories: Category[];
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onReorder: (reordered: Category[]) => void;
  isDraggingParent: boolean;
}

const SubcategoryList: React.FC<SubcategoryListProps> = ({
  parentId,
  parentIndex,
  subcategories,
  onView,
  onEdit,
  onDelete,
  onReorder,
  isDraggingParent,
}) => {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subcategories.findIndex(
        (item) => `sub-${item.id}` === active.id
      );
      const newIndex = subcategories.findIndex(
        (item) => `sub-${item.id}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(subcategories, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  return (
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
        items={subcategories.map((sub) => `sub-${sub.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 pl-4">
          {subcategories.map((subcategory, index) => (
            <SortableSubcategory
              key={subcategory.id}
              subcategory={subcategory}
              displayIndex={`${parentIndex}.${index + 1}`}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

// ============================================
// Sortable Subcategory Item
// ============================================
interface SortableSubcategoryProps {
  subcategory: Category;
  displayIndex: string;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const SortableSubcategory: React.FC<SortableSubcategoryProps> = ({
  subcategory,
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
  } = useSortable({ id: `sub-${subcategory.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 250ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease",
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between w-full p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ${
        isDragging ? "ring-2 ring-primary bg-primary/5 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-all duration-200 ${
            isDragging
              ? "bg-primary/20 shadow-sm"
              : "hover:bg-primary/10 hover:shadow-sm"
          }`}
          {...dndAttributes}
          {...listeners}
        >
          <GripVertical
            className={`h-4 w-4 transition-colors duration-200 ${
              isDragging ? "text-primary" : "text-primary/50"
            }`}
          />
        </div>

        {/* Display Index */}
        <div className="w-10 text-center font-mono text-xs text-gray-500">
          {displayIndex}
        </div>

        {subcategory.image ? (
          <img
            src={subcategory.image}
            alt={subcategory.name_en}
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {subcategory.name_en}
          </span>
          <span className="text-xs text-gray-500">{subcategory.name_ar}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={subcategory.visible ? "success" : "danger"}>
          {subcategory.visible ? "Visible" : "Hidden"}
        </Badge>
        <div className="flex gap-1">
          <IconButton
            variant="view"
            onClick={() => onView(subcategory)}
            title="View subcategory"
          />
          <IconButton
            variant="edit"
            onClick={() => onEdit(subcategory)}
            title="Edit subcategory"
          />
          <IconButton
            variant="delete"
            onClick={() => onDelete(subcategory)}
            title="Delete subcategory"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main CategoryAccordion Component
// ============================================
export default function CategoryAccordion({
  categories,
  onView,
  onEdit,
  onDelete,
  onReorder,
}: CategoryAccordionProps) {
  const [isDraggingParent, setIsDraggingParent] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const openItemsBeforeDragRef = useRef<string[]>([]);
  const dragStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group categories by parent
  const parentCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parent_id);
  }, [categories]);

  const childrenByParent = useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (cat.parent_id) {
        if (!acc[cat.parent_id]) {
          acc[cat.parent_id] = [];
        }
        acc[cat.parent_id].push(cat);
      }
      return acc;
    }, {} as Record<number, Category[]>);
  }, [categories]);

  // Local state for ordering
  const [orderedParents, setOrderedParents] = useState<Category[]>(parentCategories);
  const [orderedChildren, setOrderedChildren] = useState<Record<number, Category[]>>(childrenByParent);

  // Update local state when categories change
  useEffect(() => {
    setOrderedParents(parentCategories);
    setOrderedChildren(childrenByParent);
  }, [parentCategories, childrenByParent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragStartTimeoutRef.current) {
        clearTimeout(dragStartTimeoutRef.current);
      }
    };
  }, []);

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

  const handleParentDragStart = useCallback((event: DragStartEvent) => {
    // Save current open items
    openItemsBeforeDragRef.current = [...openItems];
    
    // Immediately close all accordions
    setOpenItems([]);
    setIsDraggingParent(true);
  }, [openItems]);

  const handleParentDragEnd = useCallback((event: DragEndEvent) => {
    // Clear any pending timeout
    if (dragStartTimeoutRef.current) {
      clearTimeout(dragStartTimeoutRef.current);
    }
    
    setIsDraggingParent(false);
    
    // Restore open items after a brief delay to allow drop animation
    setTimeout(() => {
      setOpenItems(openItemsBeforeDragRef.current);
    }, 150);
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedParents.findIndex(
        (item) => `parent-${item.id}` === active.id
      );
      const newIndex = orderedParents.findIndex(
        (item) => `parent-${item.id}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedParents, oldIndex, newIndex);
        setOrderedParents(newOrder);

        // Notify parent component of reorder
        if (onReorder) {
          const reorderData: ReorderItem[] = newOrder.map((cat, index) => ({
            id: cat.id,
            sortOrder: index,
            parentId: null,
          }));
          
          // Also include all subcategories with their orders
          Object.entries(orderedChildren).forEach(([parentId, children]) => {
            children.forEach((child, childIndex) => {
              reorderData.push({
                id: child.id,
                sortOrder: childIndex,
                parentId: parseInt(parentId),
              });
            });
          });
          
          onReorder(reorderData);
        }
      }
    }
  }, [orderedParents, orderedChildren, onReorder]);

  const handleSubcategoryReorder = useCallback((parentId: number, reordered: Category[]) => {
    const newOrderedChildren = { ...orderedChildren, [parentId]: reordered };
    setOrderedChildren(newOrderedChildren);

    // Notify parent component of reorder
    if (onReorder) {
      const reorderData: ReorderItem[] = orderedParents.map((cat, index) => ({
        id: cat.id,
        sortOrder: index,
        parentId: null,
      }));

      Object.entries(newOrderedChildren).forEach(([pId, children]) => {
        children.forEach((child, childIndex) => {
          reorderData.push({
            id: child.id,
            sortOrder: childIndex,
            parentId: parseInt(pId),
          });
        });
      });

      onReorder(reorderData);
    }
  }, [orderedParents, orderedChildren, onReorder]);

  const handleOpenChange = useCallback((value: string[]) => {
    // Only allow opening when not dragging parent
    if (!isDraggingParent) {
      setOpenItems(value);
    }
  }, [isDraggingParent]);

  if (parentCategories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No categories found</div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleParentDragStart}
      onDragEnd={handleParentDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext
        items={orderedParents.map((cat) => `parent-${cat.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <Accordion
          type="multiple"
          className="w-full"
          value={openItems}
          onValueChange={handleOpenChange}
        >
          {orderedParents.map((category, index) => {
            const children = orderedChildren[category.id] || [];

            return (
              <SortableParentCategory
                key={category.id}
                category={category}
                displayIndex={index + 1}
                children={children}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onSubcategoryReorder={handleSubcategoryReorder}
                isDraggingParent={isDraggingParent}
                canDrag={canDrag}
              />
            );
          })}
        </Accordion>
      </SortableContext>
    </DndContext>
  );
}

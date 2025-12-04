"use client";

import React, { ReactNode, useCallback } from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  MeasuringStrategy,
  DraggableAttributes,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../lib/utils";

// ============================================
// Types
// ============================================
export interface SortableItem {
  id: string | number;
  [key: string]: unknown;
}

export interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  getItemId?: (item: T) => UniqueIdentifier;
  className?: string;
  disabled?: boolean;
}

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
}

// ============================================
// SortableItem Component (wrapper for each item)
// ============================================
interface SortableItemWrapperProps<T extends SortableItem> {
  item: T;
  index: number;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => ReactNode;
  getItemId: (item: T) => UniqueIdentifier;
}

function SortableItemWrapper<T extends SortableItem>({
  item,
  index,
  renderItem,
  getItemId,
}: SortableItemWrapperProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getItemId(item) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, index, { attributes, listeners, isDragging })}
    </div>
  );
}

// ============================================
// SortableList Component
// ============================================
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  onDragStart,
  onDragEnd,
  renderItem,
  renderOverlay,
  getItemId = (item) => item.id,
  className,
  disabled = false,
}: SortableListProps<T>) {
  const [activeItem, setActiveItem] = React.useState<T | null>(null);

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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const item = items.find((i) => getItemId(i) === active.id);
      if (item) {
        setActiveItem(item);
        onDragStart?.();
      }
    },
    [items, getItemId, onDragStart]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      onDragEnd?.();

      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
        const newIndex = items.findIndex((item) => getItemId(item) === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onReorder(newItems);
        }
      }
    },
    [items, getItemId, onReorder, onDragEnd]
  );

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item, index) =>
          renderItem(item, index, {
            attributes: {
              role: "button",
              tabIndex: 0,
              "aria-disabled": true,
              "aria-pressed": undefined,
              "aria-roledescription": "sortable",
              "aria-describedby": "",
            },
            listeners: undefined,
            isDragging: false,
          })
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableItemWrapper
              key={getItemId(item)}
              item={item}
              index={index}
              renderItem={renderItem}
              getItemId={getItemId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{
        duration: 250,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        {activeItem && renderOverlay ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================
// DragHandle Component (reusable drag handle)
// ============================================
interface DragHandleComponentProps {
  dragHandleProps: DragHandleProps;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const DragHandle: React.FC<DragHandleComponentProps> = ({
  dragHandleProps,
  className,
  size = "md",
}) => {
  const { attributes, listeners, isDragging } = dragHandleProps;

  const sizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-2.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "cursor-grab active:cursor-grabbing rounded-lg transition-all duration-200",
        isDragging
          ? "bg-primary/20 shadow-sm"
          : "hover:bg-primary/10 hover:shadow-sm",
        sizeClasses[size],
        className
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className={cn(
          "transition-colors duration-200",
          isDragging ? "text-primary" : "text-primary/50",
          iconSizes[size]
        )}
      />
    </div>
  );
};

// ============================================
// SortableTableRow Component (for table-based sorting)
// ============================================
export interface SortableTableRowProps {
  id: string | number;
  children: ReactNode;
  className?: string;
}

export const SortableTableRow = React.forwardRef<
  HTMLTableRowElement,
  SortableTableRowProps & { style?: React.CSSProperties }
>(({ id, children, className, style, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      style={style}
      className={cn("transition-all duration-200", className)}
      {...props}
    >
      {children}
    </tr>
  );
});

SortableTableRow.displayName = "SortableTableRow";

// ============================================
// useSortableItem Hook (for custom implementations)
// ============================================
export function useSortableItem(id: UniqueIdentifier) {
  const sortable = useSortable({ id });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition || "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",
    zIndex: sortable.isDragging ? 50 : undefined,
    position: sortable.isDragging ? "relative" : undefined,
    opacity: sortable.isDragging ? 0.5 : 1,
  };

  return {
    ...sortable,
    style,
    dragHandleProps: {
      attributes: sortable.attributes,
      listeners: sortable.listeners,
      isDragging: sortable.isDragging,
    },
  };
}

// Re-export needed dnd-kit utilities
export { arrayMove } from "@dnd-kit/sortable";
export type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

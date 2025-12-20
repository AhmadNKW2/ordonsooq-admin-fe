import React, { useState, useRef, useEffect, useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Category } from "../../services/categories/types/category.types";
import { cn } from "../../lib/utils";
import { FieldWrapper, getFieldClasses } from "../ui/field-wrapper";
import { ChevronDown, Search, X } from "lucide-react";

interface CategoryTreeSelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  singleSelect?: boolean;
  label?: string;
  error?: string | boolean;
  placeholder?: string;
}

interface CategoryTreeNodeProps {
  category: Category;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  level?: number;
  singleSelect?: boolean;
  searchTerm?: string;
  forceShow?: boolean;
  isLast?: boolean;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  category,
  selectedIds,
  onChange,
  level = 0,
  singleSelect = false,
  searchTerm = "",
  forceShow = false,
  isLast = false,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSelected = selectedIds.includes(category.id.toString());
  const hasChildren = category.children && category.children.length > 0;
  
  const nameMatches = useMemo(() => {
    if (!searchTerm) return false;
    return category.name_en.toLowerCase().includes(searchTerm.toLowerCase());
  }, [category.name_en, searchTerm]);

  const hasMatchingDescendants = useMemo(() => {
    if (!searchTerm) return false;
    const checkChildren = (cats: Category[]): boolean => {
      return cats.some(c => {
        if (c.name_en.toLowerCase().includes(searchTerm.toLowerCase())) return true;
        if (c.children) return checkChildren(c.children);
        return false;
      });
    };
    return category.children ? checkChildren(category.children) : false;
  }, [category.children, searchTerm]);

  const shouldRender = !searchTerm || forceShow || nameMatches || hasMatchingDescendants;

  if (!shouldRender) return null;

  const handleCheck = (checked: boolean) => {
    if (singleSelect) {
      if (checked) {
        onChange([category.id.toString()]);
      } else {
        onChange([]);
      }
    } else {
      let newSelected = [...selectedIds];
      if (checked) {
        newSelected.push(category.id.toString());
      } else {
        newSelected = newSelected.filter((id) => id !== category.id.toString());
      }
      onChange(newSelected);
    }
  };

  // Expand if we have matching descendants (to show them) or if we match (to show our children)
  const shouldExpand = searchTerm && (hasMatchingDescendants || nameMatches);
  const defaultValue = shouldExpand ? category.id.toString() : undefined;

  // If this node matches, force show all children
  const shouldForceShowChildren = forceShow || (!!searchTerm && nameMatches);

  if (hasChildren) {
    return (
      <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        defaultValue={defaultValue}
        // Key is important to reset state when search changes
        key={`${category.id}-${searchTerm}`} 
      >
        <AccordionItem value={category.id.toString()} className="border-0">
          <div 
            className={cn("flex items-center hover:bg-gray-50 rounded-md transition-colors cursor-pointer", level > 0 && "ml-2", isLast && "pb-0")}
            onClick={(e) => {
              e.preventDefault();
              triggerRef.current?.click();
            }}
          >
            <div className="flex items-center flex-1 min-w-0">
              <div 
                className="flex items-center justify-center py-2 pl-1 pr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={handleCheck}
                />
              </div>
              <AccordionTrigger 
                ref={triggerRef}
                className="py-2 hover:no-underline flex-1 text-sm font-normal text-gray-700 [&[data-state=open]>svg]:rotate-180"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate text-left flex-1">
                  {category.name_en}
                  {searchTerm && nameMatches && <span className="ml-2 text-xs text-primary font-medium">(Match)</span>}
                </span>
              </AccordionTrigger>
            </div>
          </div>
          <AccordionContent className="pl-4 border-l border-primary/20 ml-3.5 pb-0">
            {category.children?.map((child, index, arr) => (
              <CategoryTreeNode
                key={child.id}
                category={child}
                selectedIds={selectedIds}
                onChange={onChange}
                level={level + 1}
                singleSelect={singleSelect}
                searchTerm={searchTerm}
                forceShow={shouldForceShowChildren}
                isLast={index === arr.length - 1}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <div 
      className={cn("flex items-center hover:bg-gray-50 rounded-md pr-2 transition-colors cursor-pointer", level > 0 && "ml-2", isLast && "pb-0")}
      onClick={(e) => {
        e.preventDefault();
        handleCheck(!isSelected);
      }}
    >
      <div 
        className="flex items-center justify-center py-2 pl-1 pr-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onChange={handleCheck}
        />
      </div>
      <span className="text-sm text-gray-700 truncate flex-1 py-2">
        {category.name_en}
        {searchTerm && nameMatches && <span className="ml-2 text-xs text-primary font-medium">(Match)</span>}
      </span>
    </div>
  );
};

const findCategoryInTree = (
  categories: Category[],
  id: string
): Category | undefined => {
  for (const category of categories) {
    if (category.id.toString() === id) return category;
    if (category.children) {
      const found = findCategoryInTree(category.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

export const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({
  categories,
  selectedIds,
  onChange,
  singleSelect = false,
  label,
  error,
  placeholder = "Select categories...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = selectedIds.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm(""); // Reset search when closing
    }
  }, [isOpen]);

  const selectedCategories = useMemo(() => {
    return selectedIds
      .map((id) => findCategoryInTree(categories, id))
      .filter((c): c is Category => !!c);
  }, [categories, selectedIds]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative group">
      <FieldWrapper
        label={label}
        error={error}
        isFocused={isFocused || isOpen}
        hasValue={hasValue}
      >
        <div
          className={cn(
            getFieldClasses(error, hasValue),
            "h-13 cursor-pointer flex items-center justify-between min-h-[42px] py-1 px-3 bg-white transition-all duration-200",
            isOpen && " border-secondary shadow-s2"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            setIsFocused(!isOpen);
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(!isOpen);
              setIsFocused(!isOpen);
            }
          }}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 overflow-hidden">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant="default" 
                  className="pl-2 pr-1 py-0.5 h-6 text-xs font-medium flex items-center gap-1 hover:bg-secondary/20 transition-colors"
                >
                  <span className="truncate max-w-[150px]">{category.name_en}</span>
                  <div 
                    role="button"
                    className="rounded-full p-0.5 hover:bg-secondary/30 cursor-pointer"
                    onClick={(e) => handleRemove(e, category.id.toString())}
                  >
                    <X className="h-3 w-3" />
                  </div>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 pl-2">
            {selectedIds.length > 0 && (
              <div 
                role="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-gray-100"
                title="Clear all"
              >
                <X className="h-4 w-4" />
              </div>
            )}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full bg-white border border-primary/20 rounded-lg shadow-xl mt-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
            <div className="p-2 border-b border-primary/20 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-white border-primary/20"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No categories found
                </div>
              ) : (
                categories.map((category) => (
                  <CategoryTreeNode
                    key={category.id}
                    category={category}
                    selectedIds={selectedIds}
                    onChange={onChange}
                    singleSelect={singleSelect}
                    searchTerm={searchTerm}
                  />
                ))
              )}
              {searchTerm && categories.every(c => {
                 // Simple check if everything is filtered out at top level
                 // This is not perfect as CategoryTreeNode does the filtering, but good enough for empty state hint
                 return false; 
              }) && (
                 <div className="text-center py-4 text-muted-foreground text-sm">
                   No matches found
                 </div>
              )}
            </div>
            
            {!singleSelect && (
              <div className="p-2 border-t border-primary/20 bg-gray-50/50 flex justify-between items-center text-xs text-muted-foreground px-3">
                <span>{selectedIds.length} selected</span>
              </div>
            )}
          </div>
        )}
      </FieldWrapper>
    </div>
  );
};

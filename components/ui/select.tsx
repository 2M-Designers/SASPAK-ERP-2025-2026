import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
  sideOffset?: number;
  style?: React.CSSProperties;
}

interface SelectContextType {
  selectedValue: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined,
);

export function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled = false,
  className = "",
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(
    value || defaultValue || "",
  );
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Update internal value when external value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both trigger and content
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Use timeout to let item click handler fire first
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  const contextValue: SelectContextType = {
    selectedValue: internalValue,
    onValueChange: handleValueChange,
    isOpen,
    setIsOpen,
    placeholder,
    disabled,
    triggerRef,
    contentRef,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={`relative ${className}`}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectTrigger must be used within a Select component");
  }

  return (
    <div
      ref={context.triggerRef}
      className={`flex items-center justify-between w-full p-2 border rounded-md ${
        context.disabled
          ? "bg-gray-100 cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-gray-400"
      } ${className}`}
      onClick={() => !context.disabled && context.setIsOpen(!context.isOpen)}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 transition-transform ${
          context.isOpen ? "rotate-180" : ""
        } ${context.disabled ? "text-gray-400" : ""}`}
      />
    </div>
  );
}

export function SelectValue({
  placeholder,
  children,
}: {
  placeholder?: string;
  children?: React.ReactNode;
}) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectValue must be used within a Select component");
  }

  // Priority: children (display text) > placeholder > default
  const displayValue =
    children || placeholder || context.placeholder || "Select an option";

  return (
    <span
      className={!context.selectedValue && !children ? "text-gray-500" : ""}
    >
      {displayValue}
    </span>
  );
}

export function SelectContent({
  children,
  className = "",
  position = "popper",
  sideOffset = 5,
  style = {},
}: SelectContentProps) {
  const context = React.useContext(SelectContext);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>(
    {},
  );

  if (!context) {
    throw new Error("SelectContent must be used within a Select component");
  }

  // Calculate dropdown position
  React.useEffect(() => {
    if (!context.isOpen || !context.triggerRef.current) return;

    const updatePosition = () => {
      const trigger = context.triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top = rect.bottom + sideOffset + window.scrollY;
      let maxHeight = Math.min(300, spaceBelow - 20);

      // If not enough space below and more space above, position above
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        top = rect.top - sideOffset + window.scrollY;
        maxHeight = Math.min(300, spaceAbove - 20);
        setDropdownStyle({
          position: "absolute",
          top: "auto",
          bottom: `${viewportHeight - rect.top + sideOffset}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          maxHeight: `${maxHeight}px`,
          zIndex: 9999,
        });
      } else {
        setDropdownStyle({
          position: "absolute",
          top: `${top}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          maxHeight: `${maxHeight}px`,
          zIndex: 9999,
        });
      }
    };

    updatePosition();

    // Update position on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [context.isOpen, context.triggerRef, sideOffset]);

  if (!context.isOpen || context.disabled) return null;

  // Render dropdown using portal
  const dropdownContent = (
    <div
      ref={context.contentRef}
      className={`bg-white border rounded-md shadow-lg overflow-hidden ${className}`}
      style={{ ...dropdownStyle, ...style }}
    >
      {children}
    </div>
  );

  // Render in portal to escape table overflow
  if (typeof document !== "undefined") {
    return createPortal(dropdownContent, document.body);
  }

  return null;
}

export function SelectItem({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectItem must be used within a Select component");
  }

  const isSelected = context.selectedValue === value;

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    context.onValueChange(value);
  };

  return (
    <div
      className={`p-2 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-100 text-blue-800 font-medium"
          : "hover:bg-gray-100"
      } ${className}`}
      onMouseDown={handleSelect}
    >
      {children}
    </div>
  );
}

// Additional utility components
export function SelectGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function SelectLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-2 text-sm font-semibold text-gray-700 border-b ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectSeparator({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-gray-200 my-1 ${className}`} />;
}

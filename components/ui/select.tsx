import * as React from "react";
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

interface SelectContextType {
  selectedValue: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined
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
    value || defaultValue || ""
  );

  // Update internal value when external value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

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

  // Use children if provided, otherwise fall back to selected value
  const displayValue =
    children ||
    context.selectedValue ||
    placeholder ||
    context.placeholder ||
    "Select an option";

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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectContent must be used within a Select component");
  }

  if (!context.isOpen || context.disabled) return null;

  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
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

  const handleClick = () => {
    context.onValueChange(value);
  };

  return (
    <div
      className={`p-2 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-100 text-blue-800 font-medium"
          : "hover:bg-gray-100"
      } ${className}`}
      onClick={handleClick}
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

"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<"input"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, checked, onCheckedChange, onChange, disabled, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "border-input h-4 w-4 shrink-0 rounded border bg-background shadow-xs transition-all relative flex items-center justify-center",
            "peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px] peer-focus-visible:border-ring",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            checked && "bg-primary border-primary",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

"use client";
import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type ComboboxOption = {
  label: string;
  value: string;
};

interface ManagerComboboxProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: ComboboxOption[];
}

export function ManagerCombobox({
  value,
  onChange,
  options,
}: ManagerComboboxProps) {
  // Add 'All' option at the top
  const allOptions = React.useMemo(
    () => [{ label: "All Supervisors Jobs", value: "" }, ...options],
    [options],
  );
  // Ensure controlled value is always a string
  const controlledValue = typeof value === "string" ? value : "";
  // Match Combobox's onValueChange signature: (value: string | null, eventDetails) => void
  const handleValueChange = (v: string | null) => {
    if (v === null || v === "") {
      onChange("");
    } else {
      onChange(v);
    }
  };
  // Find the label for the current value
  const getLabelForValue = (val: string) => {
    const found = allOptions.find((opt) => opt.value === val);
    return found ? found.label : "";
  };
  return (
    <Combobox
      value={controlledValue}
      onValueChange={handleValueChange}
      itemToStringLabel={getLabelForValue}
    >
      <ComboboxInput
        placeholder=""
        showClear={!!controlledValue}
        className="w-full text-muted-foreground"
      />
      <ComboboxContent>
        <ComboboxList>
          {allOptions.map((option) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>No options found.</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

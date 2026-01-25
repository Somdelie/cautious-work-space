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

export type ComboboxOption = { label: string; value: string };

interface JobComboboxProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: ComboboxOption[];
}

export function JobCombobox({ value, onChange, options }: JobComboboxProps) {
  const controlledValue = typeof value === "string" ? value : "";

  const handleValueChange = (v: string | null) => {
    if (!v) onChange(undefined);
    else onChange(v);
  };

  const getLabelForValue = (val: string) => {
    const found = options.find((opt) => opt.value === val);
    return found ? found.label : "";
  };

  return (
    <Combobox
      value={controlledValue}
      onValueChange={handleValueChange}
      itemToStringLabel={getLabelForValue}
    >
      <ComboboxInput
        placeholder="Filter by job..."
        showClear={!!controlledValue}
        className="w-full bg-slate-900 border-slate-800"
      />
      <ComboboxContent>
        <ComboboxList>
          {options.map((option) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>No jobs found.</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

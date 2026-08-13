"use client";

import { useState } from "react";

interface ToggleOptionProps {
  label?: string;
  description?: string;
  value?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleOption({
  label,
  description,
  value,
  defaultChecked = false,
  onChange,
}: ToggleOptionProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const checked = value ?? internalChecked;

  function handleToggle() {
    const next = !checked;
    setInternalChecked(next);
    onChange?.(next);
  }

  if (!label) {
    return (
      <button
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          checked ? "toggle-on-gradient" : "bg-white/12"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-white/40">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          checked ? "toggle-on-gradient" : "bg-white/12"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

"use client";

import { useTheme } from "../../../hooks/useTheme";

interface OptionGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function OptionGroup({
  title,
  description,
  children,
}: OptionGroupProps) {
  const colors = useTheme();

  return (
    <div
      className="settings-card-gradient rounded-xl p-5"
    >
      <div className="mb-4">
        <h3 className={`text-sm font-medium ${colors.current.text.primary}`}>
          {title}
        </h3>
        {description && (
          <p className={`mt-1 text-xs ${colors.current.text.secondary}`}>
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

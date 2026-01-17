"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border border-yellow-400 bg-yellow-50 p-4 text-yellow-900 flex items-start gap-3",
          className,
        )}
        {...props}
      >
        <AlertTriangle className="w-5 h-5 mt-1 text-yellow-500 shrink-0" />
        <div>
          {title && <div className="font-semibold mb-1">{title}</div>}
          {description && (
            <div className="text-sm leading-tight">{description}</div>
          )}
          {!description && props.children}
        </div>
      </div>
    );
  },
);
Alert.displayName = "Alert";

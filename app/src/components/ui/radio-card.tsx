"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type RadioCardProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "type" | "children"
> & {
  label: React.ReactNode;
  price?: React.ReactNode;
  containerClassName?: string;
};

export function RadioCard({
  id: idProp,
  className,
  containerClassName,
  label,
  price,
  disabled,
  ...props
}: RadioCardProps) {
  const autoId = React.useId();
  const id = idProp ?? autoId;

  return (
    <label
      htmlFor={id}
      className={cn("block w-full select-none", disabled && "cursor-not-allowed", containerClassName)}
    >
      <input
        id={id}
        type="radio"
        disabled={disabled}
        className={cn("peer sr-only", className)}
        {...props}
      />

      <div
        className={cn(
          "flex min-w-35 items-start justify-between gap-4 rounded-r1 border border-primary/20 p-3.25 text-sm",
          "transition-all duration-200 ease-out",
          "hover:border-primary hover:bg-primary/5 cursor-pointer",
          // Style nested indicator/dot when the sibling input (peer) is checked/disabled
          "peer-checked:**:data-indicator:border-primary",
          "peer-checked:**:data-dot:opacity-100",
          "peer-disabled:**:data-indicator:text-muted-foreground",
          "peer-disabled:cursor-not-allowed peer-disabled:bg-muted peer-disabled:opacity-80",
          "peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/70 peer-checked:bg-primary/10 ",
          "peer-focus-visible: peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25"
        )}
      >
        <div className="flex gap-3">
          <span
            aria-hidden="true"
            data-indicator
            className={cn(
              "mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background shadow-sm",
              "text-primary"
            )}
          >
            <span data-dot className="h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity" />
          </span>

          <div className="flex flex-col leading-5">
            <span className="font-medium text-foreground">{label}</span>
          </div>
        </div>

        {price ? (
          <span className="mt-0.5 font-medium text-primary peer-disabled:text-muted-foreground">
            {price}
          </span>
        ) : null}
      </div>
    </label>
  );
}

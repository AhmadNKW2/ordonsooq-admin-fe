"use client";

import React from "react";
import { Button } from "../ui/button";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  cancelAction?: {
    label?: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  iconBgColor = "bg-primary",
  action,
  cancelAction,
}) => {
  return (
    <div className="w-full justify-between items-center flex gap-5">
      <div className="flex items-center gap-5">
        <div className={`rounded-r1 ${iconBgColor} p-3`}>
          <span className="h-6 w-6 text-white flex items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
            {icon}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1">{description}</p>
        </div>
      </div>
      {(action || cancelAction) && (
        <div className="flex items-center gap-3">
          {cancelAction && (
            <Button
              variant="solid"
              onClick={cancelAction.onClick}
              disabled={cancelAction.disabled}
              color="var(--color-primary2)"
            >
              {cancelAction.label || "Cancel"}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} disabled={action.disabled}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

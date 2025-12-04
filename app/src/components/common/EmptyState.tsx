"use client";

import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <span className="h-16 w-16 text-gray-300 mb-4 flex items-center justify-center [&>svg]:h-16 [&>svg]:w-16">
        {icon}
      </span>
      <div className="font-medium text-lg">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  );
};

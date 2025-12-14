import { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

type FiltersCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function FiltersCard({ title = "Filters", children, className }: FiltersCardProps) {
  return (
    <Card className={cn("flex flex-col gap-5", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

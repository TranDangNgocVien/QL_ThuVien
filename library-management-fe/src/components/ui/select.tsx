import * as React from "react";
import { cn } from "../../lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "focus-ring h-10 w-full rounded-xl border border-paper-line bg-white px-3 text-sm text-ink",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

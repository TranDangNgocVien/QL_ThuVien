import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "focus-ring h-10 w-full rounded-xl border border-paper-line bg-white px-3 text-sm text-ink placeholder:text-ink/40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "focus-ring w-full rounded-xl border border-paper-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      "mb-1 block text-xs font-semibold uppercase tracking-wide text-stacks/80",
      className,
    )}
    {...props}
  />
);

export const FieldError = ({ children }: { children?: string }) => {
  if (!children) return null;
  return <p className="mt-1 text-xs text-rust">{children}</p>;
};

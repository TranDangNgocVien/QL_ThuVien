import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "catalog-card w-full max-w-lg animate-in bg-white p-6",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-paper-line pb-3">
          <h2 className="font-display text-xl font-semibold text-stacks-dark">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-xl p-1 text-ink/60 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="catalog-card w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-rust">
          {title}
        </h3>
        <p className="mt-2 text-sm text-ink/70">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="focus-ring h-9 rounded-xl border border-ink/20 px-3 text-sm hover:bg-ink/5"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="focus-ring h-9 rounded-xl border border-rust bg-rust px-3 text-sm text-paper hover:bg-rust/90 disabled:opacity-50"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

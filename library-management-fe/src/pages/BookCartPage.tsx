import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { requestBorrowSlip } from "../api/loansApi";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useBookCart } from "../context/BookCartContext";
import { ConfirmDialog } from "../components/ui/dialog";
import type { CartItem } from "../context/BookCartContext";

const MAX_SLIP_BOOKS = 3;

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function BookCartPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { cart, removeBook, updateQuantity, clearBooks } = useBookCart();
  const today = toDateInputValue(new Date());

  const [selectedBookIds, setSelectedBookIds] = useState<(string | number)[]>(
    cart.map((item) => item.book.id),
  );
  const [borrowDate, setBorrowDate] = useState(today);
  const [dueDate, setDueDate] = useState(toDateInputValue(addDays(new Date(), 14)));
  const [pendingRemoveItem, setPendingRemoveItem] = useState<CartItem | null>(null);

  const selectedItems = cart.filter((item) =>
    selectedBookIds.some((id) => String(id) === String(item.book.id)),
  );
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const borrowSlipMutation = useMutation({
    mutationFn: requestBorrowSlip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    },
  });

  const toggleBook = (bookId: string | number, checked: boolean) => {
    setSelectedBookIds((current) => {
      if (!checked) return current.filter((id) => String(id) !== String(bookId));
      if (current.some((id) => String(id) === String(bookId))) return current;
      return [...current, bookId];
    });
  };

  const handleRemove = () => {
    if (!pendingRemoveItem) return;
    removeBook(pendingRemoveItem.book.id);
    setSelectedBookIds((current) =>
      current.filter((id) => String(id) !== String(pendingRemoveItem.book.id)),
    );
    setPendingRemoveItem(null);
  };

  const handleQuantityChange = (item: CartItem, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setPendingRemoveItem(item);
      return;
    }
    updateQuantity(item.book.id, Math.min(nextQuantity, item.book.available));
  };

  const handleBorrow = async () => {
    if (selectedItems.length === 0) return;
    if (selectedItems.length > MAX_SLIP_BOOKS || selectedQuantity > MAX_SLIP_BOOKS) {
      toast.error(t("search.maxSelectionError", { max: MAX_SLIP_BOOKS }));
      return;
    }
    if (borrowDate < today) {
      toast.error(t("loans.borrowDatePastError"));
      return;
    }
    if (dueDate < borrowDate) {
      toast.error(t("loans.dueDateInvalid"));
      return;
    }

    try {
      const loan = await borrowSlipMutation.mutateAsync({
        borrowDate,
        dueDate,
        items: selectedItems.map((item) => ({
          bookId: item.book.id,
          quantity: item.quantity,
        })),
      });
      toast.success(
        t("search.requestSuccess", {
          date: new Date(loan.dueDate).toLocaleDateString(),
        }),
      );
      clearBooks(selectedBookIds);
      setSelectedBookIds([]);
    } catch {
      toast.error(t("search.borrowError"));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-stacks-dark">
          {t("cart.title")}
        </h2>
        <p className="text-sm text-ink/60">{t("cart.subtitle")}</p>
      </div>

      {cart.length === 0 ? (
        <div className="catalog-card bg-card-lines p-10 text-center text-sm text-ink/60">
          {t("search.cartEmpty")}
        </div>
      ) : (
        <div className="catalog-card space-y-4 p-4">
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.book.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-paper-line bg-white p-3"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBookIds.some((id) => String(id) === String(item.book.id))}
                    onChange={(e) => toggleBook(item.book.id, e.target.checked)}
                    className="h-5 w-5 rounded border-paper-line accent-stacks"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-medium text-ink">
                      {item.book.title}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("cart.decreaseQuantity")}
                        onClick={(event) => {
                          event.preventDefault();
                          handleQuantityChange(item, item.quantity - 1);
                        }}
                      >
                        <Minus size={14} />
                      </Button>
                      <Input
                        aria-label={t("search.quantity")}
                        type="number"
                        min={0}
                        max={item.book.available}
                        value={item.quantity}
                        onClick={(event) => event.preventDefault()}
                        onChange={(event) =>
                          handleQuantityChange(item, Number(event.target.value) || 0)
                        }
                        className="h-9 w-20 text-center"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("cart.increaseQuantity")}
                        disabled={item.quantity >= item.book.available}
                        onClick={(event) => {
                          event.preventDefault();
                          handleQuantityChange(item, item.quantity + 1);
                        }}
                      >
                        <Plus size={14} />
                      </Button>
                      <span className="font-mono text-xs text-ink/50">
                        {item.quantity}/{item.book.available}
                      </span>
                    </div>
                  </div>
                </label>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("search.removeFromCart")}
                  onClick={() => setPendingRemoveItem(item)}
                >
                  <Trash2 size={15} className="text-rust" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cartBorrowDate">{t("loans.borrowDateInput")}</Label>
              <Input
                id="cartBorrowDate"
                type="date"
                min={today}
                value={borrowDate}
                onChange={(e) => {
                  setBorrowDate(e.target.value);
                  if (dueDate < e.target.value) setDueDate(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="cartDueDate">{t("loans.dueDateInput")}</Label>
              <Input
                id="cartDueDate"
                type="date"
                min={borrowDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-ink/60">
            {t("search.selectedForSlip", {
              count: selectedItems.length,
              quantity: selectedQuantity,
              max: MAX_SLIP_BOOKS,
            })}
          </p>

          <div className="flex justify-end border-t border-paper-line pt-4">
            <Button
              disabled={
                borrowSlipMutation.isPending ||
                selectedItems.length === 0 ||
                !borrowDate ||
                !dueDate
              }
              onClick={handleBorrow}
            >
              {borrowSlipMutation.isPending ? t("search.borrowing") : t("search.sendRequest")}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRemoveItem}
        title={t("cart.removeTitle")}
        body={t("cart.removeBody", { title: pendingRemoveItem?.book.title ?? "" })}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.cancel")}
        onConfirm={handleRemove}
        onCancel={() => setPendingRemoveItem(null)}
      />
    </div>
  );
}

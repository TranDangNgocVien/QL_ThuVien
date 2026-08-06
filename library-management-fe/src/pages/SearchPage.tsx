import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBooks } from "../hooks/useBooks";
import { useLoans } from "../hooks/useLoans";
import { fetchMemberByUserId } from "../api/membersApi";
import { BookFilters } from "../components/BookFilters";
import { BookTable } from "../components/BookTable";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Input, Label } from "../components/ui/input";
import { PaginationBar } from "../components/PaginationBar";
import type { Book, BookCategory } from "../types/book";

const PAGE_SIZE = 8;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debounced;
}

export default function SearchPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BookCategory | "all">("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { books, total, isLoading, isError } = useBooks({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category,
  });

  const memberQuery = useQuery({
    queryKey: ["member-by-user", user?.id],
    queryFn: () => fetchMemberByUserId(user!.id),
    enabled: !!user && user.role === "customer",
  });
  const member = memberQuery.data ?? null;

  const { requestBorrowBook, isMutating } = useLoans();
  const [borrowingBookId, setBorrowingBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState(1);

  const canBorrow = !user || member?.status === "active";
  const borrowLabel = !user ? t("search.loginToBorrow") : t("search.borrow");

  const handleBorrow = (book: Book) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!member || member.status !== "active") return;
    setBorrowQuantity(1);
    setSelectedBook(book);
  };

  const handleSubmitBorrowRequest = async () => {
    if (!selectedBook || !member) return;
    setBorrowingBookId(selectedBook.id);
    try {
      const loan = await requestBorrowBook({
        book: selectedBook,
        memberId: member.id,
        memberName: member.fullName,
        quantity: borrowQuantity,
      });
      toast.success(
        t("search.requestSuccess", {
          date: new Date(loan.dueDate).toLocaleDateString(),
        }),
      );
      setSelectedBook(null);
    } catch {
      toast.error(t("search.borrowError"));
    } finally {
      setBorrowingBookId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-stacks-dark">
          {t("nav.search")}
        </h2>
        <p className="text-sm text-ink/60">{t("search.subtitle")}</p>
      </div>

      {!user && (
        <div className="flex items-center gap-2 rounded-xl border border-stacks/25 bg-white px-4 py-3 text-sm text-stacks-dark">
          <AlertTriangle size={16} className="shrink-0 text-stacks" />
          {t("search.publicBanner")}
        </div>
      )}
      {member?.status === "pending" && (
        <div className="flex items-center gap-2 rounded-xl border border-brass/50 bg-brass/10 px-4 py-3 text-sm text-stacks-dark">
          <AlertTriangle size={16} className="shrink-0 text-brass" />
          {t("search.cardPendingBanner")}
        </div>
      )}
      {member?.status === "suspended" && (
        <div className="flex items-center gap-2 rounded-xl border border-rust/50 bg-rust/10 px-4 py-3 text-sm text-rust">
          <AlertTriangle size={16} className="shrink-0" />
          {t("search.cardSuspendedBanner")}
        </div>
      )}
      {user?.role === "customer" && !memberQuery.isLoading && !member && (
        <div className="flex items-center gap-2 rounded-xl border border-rust/50 bg-rust/10 px-4 py-3 text-sm text-rust">
          <AlertTriangle size={16} className="shrink-0" />
          {t("search.noCardBanner")}
        </div>
      )}

      <BookFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(v) => {
          setCategory(v);
          setPage(1);
        }}
        total={total}
      />

      <BookTable
        books={books}
        isLoading={isLoading}
        isError={isError}
        mode="customer"
        canBorrow={!!canBorrow}
        onBorrow={handleBorrow}
        borrowingBookId={isMutating ? borrowingBookId : null}
        borrowLabel={borrowLabel}
      />

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Dialog
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        title={t("search.requestTitle")}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-paper-line bg-paper p-3 text-sm text-ink/70">
            <div className="font-display font-medium text-ink">
              {selectedBook?.title}
            </div>
            <div className="mt-1">
              {t("search.availableCopies", {
                available: selectedBook?.available ?? 0,
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="borrowQuantity">{t("search.quantity")}</Label>
            <Input
              id="borrowQuantity"
              type="number"
              min={1}
              max={Math.min(3, selectedBook?.available ?? 1)}
              value={borrowQuantity}
              onChange={(e) => {
                const value = Number(e.target.value);
                setBorrowQuantity(Math.max(1, Math.min(3, value || 1)));
              }}
            />
            <p className="mt-1 text-xs text-ink/50">{t("search.quantityHint")}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button variant="ghost" onClick={() => setSelectedBook(null)}>
              {t("form.cancel")}
            </Button>
            <Button
              disabled={
                isMutating ||
                borrowQuantity < 1 ||
                borrowQuantity > 3 ||
                borrowQuantity > (selectedBook?.available ?? 0)
              }
              onClick={handleSubmitBorrowRequest}
            >
              {isMutating ? t("search.borrowing") : t("search.sendRequest")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

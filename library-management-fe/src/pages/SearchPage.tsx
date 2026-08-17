import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBookCart } from "../context/BookCartContext";
import { useBooks } from "../hooks/useBooks";
import { useMyMemberProfile } from "../hooks/useMembers";
import { requestBorrowSlip } from "../api/loansApi";
import { BookFilters } from "../components/BookFilters";
import { BookTable } from "../components/BookTable";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Input, Label } from "../components/ui/input";
import { PaginationBar } from "../components/PaginationBar";
import type { Book, BookCategory } from "../types/book";

const PAGE_SIZE = 8;
const MAX_SINGLE_SLIP_QUANTITY = 3;

function getBookDescription(book: Book) {
  return book.description || book.summary || book.note || "";
}

function getBookImageUrl(book: Book) {
  return (
    book.imageUrl ||
    book.coverImageUrl ||
    book.coverUrl ||
    book.thumbnailUrl ||
    book.image ||
    ""
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debounced;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function SearchPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addBook } = useBookCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BookCategory | "all">("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  // 1. Chỉ fetch danh sách sách công khai
  const { books, total, isLoading, isError } = useBooks({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category,
  });

  // 2. Lấy hồ sơ thành viên (chỉ chạy khi có token)
  const { member, isLoading: isMemberLoading } = useMyMemberProfile();

  // 3. Sử dụng mutation riêng, không kích hoạt fetch danh sách /api/loans
  const borrowSlipMutation = useMutation({
    mutationFn: requestBorrowSlip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    },
  });

  const [borrowingBookId, setBorrowingBookId] = useState<string | number | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [borrowBook, setBorrowBook] = useState<Book | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState(toDateInputValue(new Date()));
  const [dueDate, setDueDate] = useState(toDateInputValue(addDays(new Date(), 14)));

  // Chuẩn hóa trạng thái và vai trò
  const memberStatus = member?.status?.toLowerCase();
  const isCustomer = user?.role?.toLowerCase() === "customer";
  const canBorrow = !user || memberStatus === "active";
  const borrowLabel = !user ? t("search.loginToBorrow") : t("search.borrowBook");

  const openBorrowDialog = (book: Book) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (memberStatus !== "active") return;
    if (!member) return;
    setBorrowBook(book);
    setBorrowQuantity(1);
    setBorrowDate(toDateInputValue(new Date()));
    setDueDate(toDateInputValue(addDays(new Date(), 14)));
  };

  const handleBorrow = async () => {
    if (!borrowBook || !member) return;
    if (borrowDate < toDateInputValue(new Date())) {
      toast.error(t("loans.borrowDatePastError"));
      return;
    }
    if (dueDate < borrowDate) {
      toast.error(t("loans.dueDateInvalid"));
      return;
    }
    const maxQuantity = Math.min(MAX_SINGLE_SLIP_QUANTITY, borrowBook.available);
    if (borrowQuantity < 1 || borrowQuantity > maxQuantity) return;

    const book = borrowBook;
    setBorrowingBookId(book.id);
    try {
      const loan = await borrowSlipMutation.mutateAsync({
        borrowDate,
        dueDate,
        items: [{ bookId: book.id, quantity: borrowQuantity }],
      });
      toast.success(
        t("search.requestSuccess", {
          date: new Date(loan.dueDate).toLocaleDateString(),
        }),
      );
      setBorrowBook(null);
    } catch {
      toast.error(t("search.borrowError"));
    } finally {
      setBorrowingBookId(null);
    }
  };

  const handleAddToCart = (book: Book) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (memberStatus !== "active") return;
    addBook(book, 1);
    toast.success(t("search.addedToCart"));
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
      {user && memberStatus === "pending" && (
        <div className="flex items-center gap-2 rounded-xl border border-brass/50 bg-brass/10 px-4 py-3 text-sm text-stacks-dark">
          <AlertTriangle size={16} className="shrink-0 text-brass" />
          {t("search.cardPendingBanner")}
        </div>
      )}
      {user && (memberStatus === "suspended" || memberStatus === "blocked") && (
        <div className="flex items-center gap-2 rounded-xl border border-rust/50 bg-rust/10 px-4 py-3 text-sm text-rust">
          <AlertTriangle size={16} className="shrink-0" />
          {t("search.cardSuspendedBanner")}
        </div>
      )}
      {isCustomer && !isMemberLoading && !member && (
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
        onBorrow={openBorrowDialog}
        onAddToCart={user ? handleAddToCart : undefined}
        onViewDetails={setDetailBook}
        rowClickToView
        showViewButton={false}
        borrowingBookId={borrowingBookId}
        borrowLabel={borrowLabel}
        addToCartLabel={t("search.addToCart")}
      />

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Dialog
        open={!!detailBook}
        onClose={() => setDetailBook(null)}
        title={detailBook?.title ?? t("table.title")}
      >
        {detailBook && (
          <div className="space-y-4">
            <div className="grid gap-4 rounded-xl border border-paper-line bg-paper p-4 sm:grid-cols-[140px_1fr]">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-paper-line bg-white shadow-sm">
                {getBookImageUrl(detailBook) ? (
                  <img
                    src={getBookImageUrl(detailBook)}
                    alt={detailBook.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-paper text-stacks-dark">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brass/50 bg-brass/10">
                      <AlertTriangle size={28} className="text-brass" />
                    </div>
                    <span className="px-3 text-center text-xs font-medium text-ink/60">
                      {t("bookDetail.noImage")}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stamp-badge border-brass text-brass">
                    {detailBook.id}
                  </span>
                  <span className="stamp-badge border-moss text-moss">
                    {t(`category.${detailBook.category}`)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                  {detailBook.title}
                </h3>
                <p className="mt-1 text-sm text-ink/70">{detailBook.author}</p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-paper-line bg-white p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">
                  {t("table.year")}
                </dt>
                <dd className="mt-1 font-mono text-ink">{detailBook.publishedYear}</dd>
              </div>
              <div className="rounded-lg border border-paper-line bg-white p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">
                  {t("table.available")}
                </dt>
                <dd className="mt-1 font-mono text-ink">
                  {detailBook.available}/{detailBook.quantity}
                </dd>
              </div>
              {detailBook.isbn && (
                <div className="rounded-lg border border-paper-line bg-white p-3">
                  <dt className="text-xs font-medium uppercase text-ink/50">
                    {t("form.isbnLabel")}
                  </dt>
                  <dd className="mt-1 font-mono text-ink">{detailBook.isbn}</dd>
                </div>
              )}
              {detailBook.tags && detailBook.tags.length > 0 && (
                <div className="rounded-lg border border-paper-line bg-white p-3 sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-ink/50">
                    {t("form.tagsLabel")}
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {detailBook.tags.map((tag) => (
                      <span key={tag} className="stamp-badge border-stacks text-stacks-dark">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <section className="rounded-lg border border-paper-line bg-white p-4">
              <h4 className="text-xs font-medium uppercase text-ink/50">
                {t("bookDetail.description")}
              </h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">
                {getBookDescription(detailBook) || t("bookDetail.noDescription")}
              </p>
            </section>

            <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
              <Button variant="ghost" onClick={() => setDetailBook(null)}>
                {t("form.cancel")}
              </Button>
              {user && (
                <Button
                  variant="secondary"
                  disabled={detailBook.available <= 0 || !canBorrow}
                  onClick={() => {
                    setDetailBook(null);
                    handleAddToCart(detailBook);
                  }}
                >
                  {t("search.addToCart")}
                </Button>
              )}
              <Button
                disabled={detailBook.available <= 0 || !canBorrow}
                onClick={() => {
                  setDetailBook(null);
                  openBorrowDialog(detailBook);
                }}
              >
                {borrowLabel}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!borrowBook}
        onClose={() => setBorrowBook(null)}
        title={t("search.borrowSlipTitle")}
      >
        {borrowBook && (
          <div className="space-y-4">
            <div className="rounded-xl border border-paper-line bg-paper p-3 text-sm text-ink/70">
              <div className="font-display font-medium text-ink">{borrowBook.title}</div>
              <div className="mt-1">
                {t("search.availableCopies", { available: borrowBook.available })}
              </div>
            </div>

            <div>
              <Label htmlFor="singleBorrowQuantity">{t("search.quantity")}</Label>
              <Input
                id="singleBorrowQuantity"
                type="number"
                min={1}
                max={Math.min(MAX_SINGLE_SLIP_QUANTITY, borrowBook.available)}
                value={borrowQuantity}
                onChange={(e) => {
                  const value = Number(e.target.value) || 1;
                  setBorrowQuantity(
                    Math.max(
                      1,
                      Math.min(MAX_SINGLE_SLIP_QUANTITY, borrowBook.available, value),
                    ),
                  );
                }}
              />
              <p className="mt-1 text-xs text-ink/50">
                {t("search.quantityHint")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="singleBorrowDate">{t("loans.borrowDateInput")}</Label>
                <Input
                  id="singleBorrowDate"
                  type="date"
                  min={toDateInputValue(new Date())}
                  value={borrowDate}
                  onChange={(e) => {
                    setBorrowDate(e.target.value);
                    if (dueDate < e.target.value) setDueDate(e.target.value);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="singleDueDate">{t("loans.dueDateInput")}</Label>
                <Input
                  id="singleDueDate"
                  type="date"
                  min={borrowDate}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
              <Button variant="ghost" onClick={() => setBorrowBook(null)}>
                {t("form.cancel")}
              </Button>
              <Button
                disabled={
                  borrowSlipMutation.isPending ||
                  borrowQuantity < 1 ||
                  borrowQuantity > Math.min(MAX_SINGLE_SLIP_QUANTITY, borrowBook.available) ||
                  !borrowDate ||
                  !dueDate ||
                  dueDate < borrowDate
                }
                onClick={handleBorrow}
              >
                {borrowSlipMutation.isPending ? t("search.borrowing") : t("loans.create")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

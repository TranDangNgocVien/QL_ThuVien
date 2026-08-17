import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Plus } from "lucide-react";
import { useBooks } from "../hooks/useBooks";
import { BookFilters } from "../components/BookFilters";
import { BookTable } from "../components/BookTable";
import { PaginationBar } from "../components/PaginationBar";
import { BookForm } from "../components/BookForm";
import { Dialog, ConfirmDialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { ExportButton } from "../components/ExportButton";
import type { Book, BookCategory, BookInput } from "../types/book";

const PAGE_SIZE = 8;

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

export default function StaffBooksPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BookCategory | "all">("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const { books, total, isLoading, isError, createBook, updateBook, deleteBook, isMutating } =
    useBooks({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category,
    });

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const openCreate = () => {
    setEditingBook(null);
    setFormOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setFormOpen(true);
  };

  const handleSubmit = async (input: BookInput) => {
    try {
      if (editingBook) {
        await updateBook({ id: editingBook.id, input });
        toast.success(t("toast.updateSuccess"));
      } else {
        await createBook(input);
        toast.success(t("toast.createSuccess"));
        setPage(1);
      }
      setFormOpen(false);
      setEditingBook(null);
    } catch {
      toast.error(editingBook ? t("toast.updateError") : t("toast.createError"));
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    try {
      await deleteBook(deletingBook.id);
      toast.success(t("toast.deleteSuccess"));
    } catch {
      toast.error(t("toast.deleteError"));
    } finally {
      setDeletingBook(null);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="flex justify-end gap-2">
        <ExportButton books={books} />
        <Button onClick={openCreate} size="sm">
          <Plus size={14} /> {t("nav.addBook")}
        </Button>
      </div>

      <BookTable
        books={books}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
        onDelete={setDeletingBook}
        onViewDetails={setDetailBook}
        rowClickToView
        showViewButton={false}
      />

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBook ? t("form.editTitle") : t("form.addTitle")}
      >
        <BookForm
          key={editingBook?.id ?? "new"}
          defaultValues={editingBook}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={isMutating}
        />
      </Dialog>

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
                    <AlertTriangle size={28} className="text-brass" />
                    <span className="px-3 text-center text-xs font-medium text-ink/60">
                      {t("bookDetail.noImage")}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stamp-badge border-brass text-brass">{detailBook.id}</span>
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
                <dt className="text-xs font-medium uppercase text-ink/50">{t("table.year")}</dt>
                <dd className="mt-1 font-mono text-ink">{detailBook.publishedYear}</dd>
              </div>
              <div className="rounded-lg border border-paper-line bg-white p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">{t("table.available")}</dt>
                <dd className="mt-1 font-mono text-ink">
                  {detailBook.available}/{detailBook.quantity}
                </dd>
              </div>
            </dl>

            <section className="rounded-lg border border-paper-line bg-white p-4">
              <h4 className="text-xs font-medium uppercase text-ink/50">
                {t("bookDetail.description")}
              </h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">
                {getBookDescription(detailBook) || t("bookDetail.noDescription")}
              </p>
            </section>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deletingBook}
        title={t("confirm.deleteTitle")}
        body={t("confirm.deleteBody")}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingBook(null)}
        isLoading={isMutating}
      />
    </div>
  );
}

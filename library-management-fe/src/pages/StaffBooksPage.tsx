import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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

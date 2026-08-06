import { useTranslation } from "react-i18next";
import { BookPlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import type { Book } from "../types/book";

interface BookTableProps {
  books: Book[];
  isLoading: boolean;
  isError: boolean;
  /** "staff": hiện nút sửa/xoá (mặc định). "customer": hiện nút mượn sách. */
  mode?: "staff" | "customer";
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onBorrow?: (book: Book) => void;
  /** Khách chưa có thẻ thư viện active thì không cho mượn */
  canBorrow?: boolean;
  borrowingBookId?: string | null;
  borrowLabel?: string;
}

function callNumber(book: Book) {
  const prefix = book.category.slice(0, 3).toUpperCase();
  return `${prefix}-${book.publishedYear}.${book.id.toString().slice(-3)}`;
}

export function BookTable({
  books,
  isLoading,
  isError,
  mode = "staff",
  onEdit,
  onDelete,
  onBorrow,
  canBorrow = true,
  borrowingBookId = null,
  borrowLabel,
}: BookTableProps) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <div className="catalog-card p-8 text-center text-sm text-rust">
        {t("table.error")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="catalog-card p-8 text-center text-sm text-ink/60">
        {t("table.loading")}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="catalog-card bg-card-lines p-10 text-center text-sm text-ink/60">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <div className="catalog-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-paper-line bg-header-gradient text-white">
            <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide">
              {t("table.callNumber")}
            </th>
            <th className="px-4 py-3 font-display text-sm font-semibold">
              {t("table.title")}
            </th>
            <th className="hidden px-4 py-3 font-display text-sm font-semibold sm:table-cell">
              {t("table.author")}
            </th>
            <th className="hidden px-4 py-3 font-display text-sm font-semibold md:table-cell">
              {t("table.category")}
            </th>
            <th className="hidden px-4 py-3 text-center font-display text-sm font-semibold md:table-cell">
              {t("table.year")}
            </th>
            <th className="px-4 py-3 text-center font-display text-sm font-semibold">
              {t("table.available")}
            </th>
            <th className="px-4 py-3 text-right font-display text-sm font-semibold">
              {t("table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr
              key={book.id}
              className="border-b border-dashed border-paper-line last:border-0 hover:bg-brass/5"
            >
              <td className="px-4 py-3">
                <span className="stamp-badge border-brass text-brass">
                  {callNumber(book)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="font-display font-medium text-ink">
                  {book.title}
                </div>
                <div className="text-xs text-ink/50 sm:hidden">
                  {book.author}
                </div>
              </td>
              <td className="hidden px-4 py-3 text-ink/80 sm:table-cell">
                {book.author}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className="stamp-badge border-moss text-moss">
                  {t(`category.${book.category}`)}
                </span>
              </td>
              <td className="hidden px-4 py-3 text-center font-mono text-ink/70 md:table-cell">
                {book.publishedYear}
              </td>
              <td className="px-4 py-3 text-center font-mono">
                <span
                  className={
                    book.available === 0 ? "text-rust" : "text-stacks-dark"
                  }
                >
                  {book.available}/{book.quantity}
                </span>
              </td>
              <td className="px-4 py-3">
                {mode === "staff" ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("table.edit")}
                      onClick={() => onEdit?.(book)}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("table.delete")}
                      onClick={() => onDelete?.(book)}
                    >
                      <Trash2 size={15} className="text-rust" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={
                        book.available <= 0 ||
                        !canBorrow ||
                        borrowingBookId === book.id
                      }
                      onClick={() => onBorrow?.(book)}
                    >
                      <BookPlus size={14} />
                      {borrowingBookId === book.id
                        ? t("search.borrowing")
                        : (borrowLabel ?? t("search.borrow"))}
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

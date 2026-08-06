import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";
import { fetchAllBooks } from "../api/booksApi";
import { fetchLoans } from "../api/loansApi";
import { getLoanDisplayStatus } from "../types/loan";
import type { Book, BookCategory } from "../types/book";
import { Button } from "../components/ui/button";

const categories: BookCategory[] = [
  "van-hoc",
  "khoa-hoc",
  "cong-nghe",
  "lich-su",
  "thieu-nhi",
  "khac",
];

export default function StaffStatsPage() {
  const { t } = useTranslation();

  const booksQuery = useQuery({ queryKey: ["all-books"], queryFn: fetchAllBooks });
  const loansQuery = useQuery({
    queryKey: ["loans", { status: "all" }],
    queryFn: () => fetchLoans({ status: "all" }),
  });

  const books = booksQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const isLoading = booksQuery.isLoading || loansQuery.isLoading;

  const summary = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.quantity, 0);
    const totalBorrowed = books.reduce(
      (sum, b) => sum + (b.quantity - b.available),
      0,
    );
    const totalOverdue = loans.filter(
      (l) => getLoanDisplayStatus(l) === "overdue",
    ).length;
    return { totalTitles, totalCopies, totalBorrowed, totalOverdue };
  }, [books, loans]);

  const byCategory = useMemo(() => {
    return categories.map((category) => {
      const inCategory = books.filter((b: Book) => b.category === category);
      return {
        category,
        titles: inCategory.length,
        copies: inCategory.reduce((sum, b) => sum + b.quantity, 0),
        borrowed: inCategory.reduce((sum, b) => sum + (b.quantity - b.available), 0),
      };
    });
  }, [books]);

  const topBorrowed = useMemo(() => {
    const counts = new Map<string, { title: string; count: number }>();
    for (const loan of loans) {
      const existing = counts.get(loan.bookId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(loan.bookId, { title: loan.bookTitle, count: 1 });
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [loans]);

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet([
      { [t("stats.totalTitles")]: summary.totalTitles },
      { [t("stats.totalCopies")]: summary.totalCopies },
      { [t("stats.totalBorrowed")]: summary.totalBorrowed },
      { [t("stats.totalOverdue")]: summary.totalOverdue },
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    const categorySheet = XLSX.utils.json_to_sheet(
      byCategory.map((row) => ({
        [t("stats.categoryName")]: t(`category.${row.category}`),
        [t("stats.categoryTitles")]: row.titles,
        [t("stats.categoryCopies")]: row.copies,
        [t("stats.categoryBorrowed")]: row.borrowed,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, categorySheet, "By category");

    const loansSheet = XLSX.utils.json_to_sheet(
      loans.map((loan) => ({
        [t("loans.book")]: loan.bookTitle,
        [t("loans.member")]: loan.memberName,
        [t("myLoans.borrowDate")]: new Date(loan.borrowDate).toLocaleDateString(),
        [t("myLoans.dueDate")]: new Date(loan.dueDate).toLocaleDateString(),
        [t("myLoans.returnDate")]: loan.returnDate
          ? new Date(loan.returnDate).toLocaleDateString()
          : "",
        [t("myLoans.status")]: t(`loanStatus.${getLoanDisplayStatus(loan)}`),
      })),
    );
    XLSX.utils.book_append_sheet(workbook, loansSheet, "Loans");

    XLSX.writeFile(workbook, `library-report-${Date.now()}.xlsx`);
    toast.success(t("stats.exportSuccess"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-stacks-dark">
            {t("stats.title")}
          </h2>
          <p className="text-sm text-ink/60">{t("stats.subtitle")}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport} disabled={isLoading}>
          <FileDown size={14} /> {t("stats.exportReport")}
        </Button>
      </div>

      {isLoading ? (
        <div className="catalog-card p-8 text-center text-sm text-ink/60">
          {t("table.loading")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("stats.totalTitles"), value: summary.totalTitles },
              { label: t("stats.totalCopies"), value: summary.totalCopies },
              { label: t("stats.totalBorrowed"), value: summary.totalBorrowed },
              { label: t("stats.totalOverdue"), value: summary.totalOverdue },
            ].map((card) => (
              <div key={card.label} className="catalog-card p-4">
                <div className="font-mono text-2xl font-semibold text-stacks-dark">
                  {card.value}
                </div>
                <div className="mt-1 text-xs text-ink/60">{card.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-semibold text-stacks-dark">
              {t("stats.byCategory")}
            </h3>
            <div className="catalog-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper-line bg-stacks text-paper">
                    <th className="px-4 py-2 font-display text-sm font-semibold">
                      {t("stats.categoryName")}
                    </th>
                    <th className="px-4 py-2 text-center font-display text-sm font-semibold">
                      {t("stats.categoryTitles")}
                    </th>
                    <th className="px-4 py-2 text-center font-display text-sm font-semibold">
                      {t("stats.categoryCopies")}
                    </th>
                    <th className="px-4 py-2 text-center font-display text-sm font-semibold">
                      {t("stats.categoryBorrowed")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((row) => (
                    <tr
                      key={row.category}
                      className="border-b border-dashed border-paper-line last:border-0"
                    >
                      <td className="px-4 py-2">
                        <span className="stamp-badge border-moss text-moss">
                          {t(`category.${row.category}`)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{row.titles}</td>
                      <td className="px-4 py-2 text-center font-mono">{row.copies}</td>
                      <td className="px-4 py-2 text-center font-mono">{row.borrowed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-semibold text-stacks-dark">
              {t("stats.topBorrowed")}
            </h3>
            {topBorrowed.length === 0 ? (
              <div className="catalog-card bg-card-lines p-8 text-center text-sm text-ink/60">
                {t("stats.noData")}
              </div>
            ) : (
              <div className="catalog-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {topBorrowed.map((row, index) => (
                      <tr
                        key={row.title}
                        className="border-b border-dashed border-paper-line last:border-0"
                      >
                        <td className="w-10 px-4 py-2 font-mono text-brass">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-2 font-display font-medium text-ink">
                          {row.title}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-ink/70">
                          {row.count} {t("stats.timesBorrowed")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

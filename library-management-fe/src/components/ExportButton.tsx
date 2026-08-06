import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { FileDown } from "lucide-react";
import { Button } from "./ui/button";
import type { Book } from "../types/book";
import { toast } from "sonner";

interface ExportButtonProps {
  books: Book[];
}

// Tính năng tuỳ chọn (mục B): xuất dữ liệu bảng hiện tại ra file Excel.
export function ExportButton({ books }: ExportButtonProps) {
  const { t } = useTranslation();

  const handleExport = () => {
    const rows = books.map((b) => ({
      [t("table.title")]: b.title,
      [t("table.author")]: b.author,
      [t("table.category")]: t(`category.${b.category}`),
      [t("table.year")]: b.publishedYear,
      [t("table.available")]: `${b.available}/${b.quantity}`,
      ISBN: b.isbn ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Books");
    XLSX.writeFile(workbook, `library-catalog-${Date.now()}.xlsx`);
    toast.success(t("toast.exportSuccess"));
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={books.length === 0}>
      <FileDown size={14} /> {t("nav.export")}
    </Button>
  );
}

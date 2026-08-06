import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import type { BookCategory } from "../types/book";

const categories: BookCategory[] = [
  "van-hoc",
  "khoa-hoc",
  "cong-nghe",
  "lich-su",
  "thieu-nhi",
  "khac",
];

interface BookFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: BookCategory | "all";
  onCategoryChange: (value: BookCategory | "all") => void;
  total: number;
}

export function BookFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  total,
}: BookFiltersProps) {
  const { t } = useTranslation();
  const hasFilters = search !== "" || category !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <Select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as BookCategory | "all")}
        className="sm:w-56"
      >
        <option value="all">{t("filters.allCategories")}</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {t(`category.${c}`)}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-stacks/70">
        {t("filters.resultsFound", { count: total })}
        {hasFilters && (
          <button
            className="focus-ring flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-rust hover:bg-rust/10"
            onClick={() => {
              onSearchChange("");
              onCategoryChange("all");
            }}
          >
            <X size={12} />
            {t("filters.clear")}
          </button>
        )}
      </div>
    </div>
  );
}

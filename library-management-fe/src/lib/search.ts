export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function startsWithSearch(value: string | number | null | undefined, search: string) {
  const text = normalizeSearchText(String(value ?? ""));
  const keyword = normalizeSearchText(search);
  if (!keyword) return true;
  return text.startsWith(keyword) || text.split(/\s+/).some((word) => word.startsWith(keyword));
}

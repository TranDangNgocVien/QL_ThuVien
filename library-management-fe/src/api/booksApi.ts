import { apiClient } from "./client";
import type { Book, BookInput, BookQueryParams, PagedResult } from "../types/book";
import { startsWithSearch } from "../lib/search";

function encodePathId(id: string | number) {
  return encodeURIComponent(String(id));
}

function filterBooksClientSide(items: Book[], params: BookQueryParams) {
  const search = params.search?.trim().toLowerCase();

  return items.filter((book) => {
    const matchesCategory =
      !params.category || params.category === "all" || book.category === params.category;
    const matchesSearch =
      !search ||
      startsWithSearch(book.title, search) ||
      startsWithSearch(book.author, search) ||
      startsWithSearch(book.id, search);

    return matchesCategory && matchesSearch;
  });
}

function paginateClientSide<T>(items: T[], params: BookQueryParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || items.length || 1);
  const start = (page - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

export async function fetchBooks(
  params: BookQueryParams,
): Promise<PagedResult<Book>> {
  const query: Record<string, string | number | undefined> = {
    page: params.page ? params.page - 1 : 0, // Spring Boot Page bắt đầu từ index 0
    size: params.pageSize,
    search: params.search || undefined,
    category: params.category && params.category !== "all" ? params.category : undefined,
  };

  const res = await apiClient.get<any>("/books", { params: query });
  
  // Hỗ trợ cả PageResponse của Spring Data JPA { content: [], totalElements: ... } hoặc Array trực tiếp
  if (res.data && Array.isArray(res.data.content)) {
    const filteredContent = filterBooksClientSide(res.data.content, params);
    return {
      items: filteredContent,
      total: params.search || params.category
        ? filteredContent.length
        : Number(res.data.totalElements ?? res.data.total ?? res.data.content.length),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const allItems = Array.isArray(res.data) ? res.data : [];
  const filteredItems = filterBooksClientSide(allItems, params);
  const headerTotal = Number(res.headers["x-total-count"]);
  const shouldPaginateClientSide =
    !Number.isFinite(headerTotal) || filteredItems.length > (params.pageSize || filteredItems.length);

  const items = shouldPaginateClientSide
    ? paginateClientSide(filteredItems, params)
    : filteredItems;

  return {
    items,
    total: Number.isFinite(headerTotal) ? headerTotal : filteredItems.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function fetchAllBooks(): Promise<Book[]> {
  const res = await apiClient.get<Book[]>("/books/all");
  return Array.isArray(res.data) ? res.data : (res.data as any)?.content ?? [];
}

export async function createBook(input: BookInput): Promise<Book> {
  // Spring Boot tự sinh createdAt, id và xử lý book_tags
  const res = await apiClient.post<Book>("/books", input);
  return res.data;
}

export async function updateBook(id: string | number, input: BookInput): Promise<Book> {
  const res = await apiClient.put<Book>(`/books/${encodePathId(id)}`, input);
  return res.data;
}

export async function deleteBook(id: string | number): Promise<void> {
  await apiClient.delete(`/books/${encodePathId(id)}`);
}

import { apiClient } from "./client";
import type { Book, BookInput, BookQueryParams, PagedResult } from "../types/book";

export async function fetchBooks(
  params: BookQueryParams,
): Promise<PagedResult<Book>> {
  const query: Record<string, string | number> = {
    _page: params.page,
    _limit: params.pageSize,
    _sort: "createdAt",
    _order: "desc",
  };
  if (params.search) query.q = params.search;
  if (params.category && params.category !== "all") {
    query.category = params.category;
  }

  const res = await apiClient.get<Book[]>("/books", { params: query });
  const total = Number(res.headers["x-total-count"] ?? res.data.length);

  return {
    items: res.data,
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function fetchAllBooks(): Promise<Book[]> {
  const res = await apiClient.get<Book[]>("/books", {
    params: { _sort: "title", _order: "asc" },
  });
  return res.data;
}

export async function createBook(input: BookInput): Promise<Book> {
  const payload = { ...input, createdAt: new Date().toISOString() };
  const res = await apiClient.post<Book>("/books", payload);
  return res.data;
}

export async function updateBook(id: string, input: BookInput): Promise<Book> {
  const res = await apiClient.patch<Book>(`/books/${id}`, input);
  return res.data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBooks } from "../hooks/useBooks";
import * as booksApi from "../api/booksApi";
import type { Book } from "../types/book";

vi.mock("../api/booksApi");

const sampleBook: Book = {
  id: "1",
  title: "Số Đỏ",
  author: "Vũ Trọng Phụng",
  category: "van-hoc",
  publishedYear: 1936,
  quantity: 5,
  available: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useBooks", () => {
  beforeEach(() => {
    vi.mocked(booksApi.fetchBooks).mockResolvedValue({
      items: [sampleBook],
      total: 1,
      page: 1,
      pageSize: 8,
    });
    vi.mocked(booksApi.createBook).mockResolvedValue(sampleBook);
    vi.mocked(booksApi.deleteBook).mockResolvedValue(undefined);
  });

  it("loads the book list from the API", async () => {
    const { result } = renderHook(
      () => useBooks({ page: 1, pageSize: 8 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toHaveLength(1);
    expect(result.current.books[0].title).toBe("Số Đỏ");
    expect(result.current.total).toBe(1);
  });

  it("calls createBook and refreshes the list", async () => {
    const { result } = renderHook(
      () => useBooks({ page: 1, pageSize: 8 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createBook({
        title: "Sách mới",
        author: "Tác giả mới",
        category: "khac",
        publishedYear: 2024,
        quantity: 1,
        available: 1,
      });
    });

    expect(booksApi.createBook).toHaveBeenCalledTimes(1);
    expect(booksApi.fetchBooks).toHaveBeenCalled();
  });
});

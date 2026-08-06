import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBook, deleteBook, fetchBooks, updateBook } from "../api/booksApi";
import type { BookInput, BookQueryParams } from "../types/book";

const booksKey = (params: BookQueryParams) => ["books", params] as const;

/**
 * Custom hook tổng hợp toàn bộ thao tác CRUD cho đầu sách,
 * đóng gói useQuery (đọc danh sách) và useMutation (tạo/sửa/xoá)
 * kèm theo invalidate cache tự động sau mỗi thao tác ghi.
 */
export function useBooks(params: BookQueryParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: booksKey(params),
    queryFn: () => fetchBooks(params),
    staleTime: 10_000,
    placeholderData: (previousData) => previousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["books"] });

  const createMutation = useMutation({
    mutationFn: (input: BookInput) => createBook(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BookInput }) =>
      updateBook(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: invalidate,
  });

  return {
    ...listQuery,
    books: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    createBook: createMutation.mutateAsync,
    updateBook: updateMutation.mutateAsync,
    deleteBook: deleteMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

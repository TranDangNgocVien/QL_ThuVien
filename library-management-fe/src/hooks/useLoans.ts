import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveBorrowBook,
  approveReturnBook,
  createStaffLoan,
  fetchLoans,
  rejectBorrowBook,
  requestBorrowBook,
  requestReturnBook,
  type LoanQueryParams,
} from "../api/loansApi";
import type { Book } from "../types/book";
import type { Loan } from "../types/loan";

export function useLoans(params: LoanQueryParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["loans", params],
    queryFn: () => fetchLoans(params),
    staleTime: 5_000,
  });

  // Mượn/trả sách đều làm thay đổi số bản còn lại (available) nên phải
  // invalidate cả "loans" lẫn "books" để đồng bộ dữ liệu trên toàn bộ ứng dụng.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const requestBorrowMutation = useMutation({
    mutationFn: ({
      book,
      memberId,
      memberName,
      quantity,
    }: {
      book: Book;
      memberId: string;
      memberName: string;
      quantity: number;
    }) => requestBorrowBook(book, memberId, memberName, quantity),
    onSuccess: invalidate,
  });

  const createStaffLoanMutation = useMutation({
    mutationFn: ({
      book,
      memberId,
      memberName,
      quantity,
    }: {
      book: Book;
      memberId: string;
      memberName: string;
      quantity: number;
    }) => createStaffLoan(book, memberId, memberName, quantity),
    onSuccess: invalidate,
  });

  const approveBorrowMutation = useMutation({
    mutationFn: (loan: Loan) => approveBorrowBook(loan),
    onSuccess: invalidate,
  });

  const rejectBorrowMutation = useMutation({
    mutationFn: (loan: Loan) => rejectBorrowBook(loan),
    onSuccess: invalidate,
  });

  const requestReturnMutation = useMutation({
    mutationFn: (loan: Loan) => requestReturnBook(loan),
    onSuccess: invalidate,
  });

  const approveReturnMutation = useMutation({
    mutationFn: ({ loan, lateFee }: { loan: Loan; lateFee: number }) =>
      approveReturnBook(loan, lateFee),
    onSuccess: invalidate,
  });

  return {
    ...query,
    loans: query.data ?? [],
    requestBorrowBook: requestBorrowMutation.mutateAsync,
    createStaffLoan: createStaffLoanMutation.mutateAsync,
    approveBorrowBook: approveBorrowMutation.mutateAsync,
    rejectBorrowBook: rejectBorrowMutation.mutateAsync,
    requestReturnBook: requestReturnMutation.mutateAsync,
    approveReturnBook: approveReturnMutation.mutateAsync,
    isMutating:
      requestBorrowMutation.isPending ||
      createStaffLoanMutation.isPending ||
      approveBorrowMutation.isPending ||
      rejectBorrowMutation.isPending ||
      requestReturnMutation.isPending ||
      approveReturnMutation.isPending,
  };
}

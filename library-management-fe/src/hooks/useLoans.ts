import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveBorrowBook,
  approveReturnBook,
  createStaffLoan,
  createStaffLoanSlip,
  fetchLoans,
  fetchMyLoans,
  rejectBorrowBook,
  requestBorrowBook,
  requestBorrowSlip,
  requestReturnBook,
  type LoanQueryParams,
} from "../api/loansApi";
import type { Loan, LoanSlipInput } from "../types/loan";

/**
 * Hook danh cho Thủ thư hoặc quản lý danh sách phiếu mượn chung
 */
export function useLoans(params: LoanQueryParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["loans", params],
    queryFn: () => fetchLoans(params),
    staleTime: 5_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const requestBorrowMutation = useMutation({
    mutationFn: ({
      bookId,
      quantity = 1,
    }: {
      bookId: string | number;
      quantity?: number;
    }) => requestBorrowBook(bookId, quantity),
    onSuccess: invalidate,
  });

  const createStaffLoanMutation = useMutation({
    mutationFn: ({
      bookId,
      memberId,
      quantity = 1,
    }: {
      bookId: string | number;
      memberId: string | number;
      quantity?: number;
    }) => createStaffLoan(bookId, memberId, quantity),
    onSuccess: invalidate,
  });

  const requestBorrowSlipMutation = useMutation({
    mutationFn: (input: LoanSlipInput) => requestBorrowSlip(input),
    onSuccess: invalidate,
  });

  const createStaffLoanSlipMutation = useMutation({
    mutationFn: (input: LoanSlipInput) => createStaffLoanSlip(input),
    onSuccess: invalidate,
  });

  const approveBorrowMutation = useMutation({
    mutationFn: (loanOrId: Loan | string | number) => {
      const id = typeof loanOrId === "object" ? loanOrId.id : loanOrId;
      return approveBorrowBook(id);
    },
    onSuccess: invalidate,
  });

  const rejectBorrowMutation = useMutation({
    mutationFn: (loanOrId: Loan | string | number) => {
      const id = typeof loanOrId === "object" ? loanOrId.id : loanOrId;
      return rejectBorrowBook(id);
    },
    onSuccess: invalidate,
  });

  const requestReturnMutation = useMutation({
    mutationFn: (loanOrId: Loan | string | number) => {
      const id = typeof loanOrId === "object" ? loanOrId.id : loanOrId;
      return requestReturnBook(id);
    },
    onSuccess: invalidate,
  });

  const approveReturnMutation = useMutation({
    mutationFn: ({
      loan,
      lateFee = 0,
    }: {
      loan: Loan | string | number;
      lateFee?: number;
    }) => {
      const id = typeof loan === "object" ? loan.id : loan;
      return approveReturnBook(id, lateFee);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    loans: query.data ?? [],
    requestBorrowBook: requestBorrowMutation.mutateAsync,
    requestBorrowSlip: requestBorrowSlipMutation.mutateAsync,
    createStaffLoan: createStaffLoanMutation.mutateAsync,
    createStaffLoanSlip: createStaffLoanSlipMutation.mutateAsync,
    approveBorrowBook: approveBorrowMutation.mutateAsync,
    rejectBorrowBook: rejectBorrowMutation.mutateAsync,
    requestReturnBook: requestReturnMutation.mutateAsync,
    approveReturnBook: approveReturnMutation.mutateAsync,
    isMutating:
      requestBorrowMutation.isPending ||
      requestBorrowSlipMutation.isPending ||
      createStaffLoanMutation.isPending ||
      createStaffLoanSlipMutation.isPending ||
      approveBorrowMutation.isPending ||
      rejectBorrowMutation.isPending ||
      requestReturnMutation.isPending ||
      approveReturnMutation.isPending,
  };
}

/**
 * Hook dành riêng cho độc giả xem phiếu mượn của chính mình
 */
export function useMyLoans() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["my-loans"],
    queryFn: fetchMyLoans,
    staleTime: 5_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const returnBookMutation = useMutation({
    mutationFn: (loanOrId: Loan | string | number) => {
      const id = typeof loanOrId === "object" ? loanOrId.id : loanOrId;
      return requestReturnBook(id);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    loans: query.data ?? [],
    requestReturnBook: returnBookMutation.mutateAsync,
    isMutating: returnBookMutation.isPending,
  };
}

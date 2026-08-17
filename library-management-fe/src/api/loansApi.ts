import { apiClient } from "./client";
import type { Loan, LoanSlipInput } from "../types/loan";

function encodePathId(id: string | number) {
  return encodeURIComponent(String(id));
}

export interface LoanQueryParams {
  memberId?: string | number;
  status?: Loan["status"] | "all";
}

/**
 * Lấy danh sách phiếu mượn (Thủ thư xem tất cả, hoặc lọc theo query)
 */
export async function fetchLoans(params: LoanQueryParams = {}): Promise<Loan[]> {
  const query: Record<string, any> = {};
  if (params.memberId) query.memberId = params.memberId;
  if (params.status && params.status !== "all") query.status = params.status;

  const res = await apiClient.get<Loan[]>("/loans", { params: query });
  return res.data;
}

/**
 * Độc giả xem danh sách phiếu mượn của chính mình
 */
export async function fetchMyLoans(): Promise<Loan[]> {
  const res = await apiClient.get<Loan[]>("/loans/my-loans");
  return res.data;
}

/**
 * Độc giả tự mượn sách
 * Chỉ gửi bookId và quantity, Backend tự gán memberId từ JWT
 */
export async function requestBorrowBook(
  bookId: string | number,
  quantity: number = 1,
): Promise<Loan> {
  const res = await apiClient.post<Loan>("/loans/borrow", {
    bookId,
    quantity,
  });
  return res.data;
}

/**
 * Khach hang lap phieu muon gom toi da 3 sach.
 * Backend tu gan memberId tu JWT.
 */
export async function requestBorrowSlip(input: LoanSlipInput): Promise<Loan> {
  const res = await apiClient.post<Loan>("/loans/borrow-slip", {
    borrowDate: input.borrowDate,
    dueDate: input.dueDate,
    items: input.items,
  });
  return res.data;
}

/**
 * Thủ thư tạo phiếu mượn tại quầy cho một độc giả cụ thể
 */
export async function createStaffLoan(
  bookId: string | number,
  memberId: string | number,
  quantity: number = 1,
): Promise<Loan> {
  const res = await apiClient.post<Loan>("/loans/staff-borrow", {
    bookId,
    memberId,
    quantity,
  });
  return res.data;
}

/**
 * Thu thu lap phieu muon gom toi da 3 sach cho doc gia.
 */
export async function createStaffLoanSlip(input: LoanSlipInput): Promise<Loan> {
  const res = await apiClient.post<Loan>("/loans/staff-borrow-slip", input);
  return res.data;
}

/**
 * Thủ thư phê duyệt yêu cầu mượn sách
 */
export async function approveBorrowBook(loanId: string | number): Promise<Loan> {
  const res = await apiClient.post<Loan>(`/loans/${encodePathId(loanId)}/approve`, {});
  return res.data;
}

/**
 * Thủ thư từ chối yêu cầu mượn sách
 */
export async function rejectBorrowBook(loanId: string | number): Promise<Loan> {
  const res = await apiClient.post<Loan>(`/loans/${encodePathId(loanId)}/reject`, {});
  return res.data;
}

/**
 * Độc giả yêu cầu / xác nhận trả sách
 */
export async function requestReturnBook(loanId: string | number): Promise<Loan> {
  const res = await apiClient.post<Loan>(`/loans/${encodePathId(loanId)}/return`, {});
  return res.data;
}

/**
 * Thủ thư xác nhận nhận lại sách và nhập phí phạt (nếu có)
 */
export async function approveReturnBook(
  loanId: string | number,
  lateFee: number = 0,
): Promise<Loan> {
  const res = await apiClient.post<Loan>(`/loans/${encodePathId(loanId)}/confirm-return`, { lateFee });
  return res.data;
}

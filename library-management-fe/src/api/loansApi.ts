import { apiClient } from "./client";
import type { Loan } from "../types/loan";
import type { Book } from "../types/book";

export interface LoanQueryParams {
  memberId?: string;
  status?: Loan["status"] | "all";
}

export async function fetchLoans(params: LoanQueryParams = {}): Promise<Loan[]> {
  const query: Record<string, string> = { _sort: "borrowDate", _order: "desc" };
  if (params.memberId) query.memberId = params.memberId;
  if (params.status && params.status !== "all") query.status = params.status;

  const res = await apiClient.get<Loan[]>("/loans", { params: query });
  return res.data.map((loan) => ({
    ...loan,
    quantity: loan.quantity ?? 1,
    lateFee: loan.lateFee ?? 0,
  }));
}

const LOAN_PERIOD_DAYS = 14;
const MAX_BORROW_QUANTITY = 3;

function assertBorrowQuantity(book: Book, quantity: number) {
  if (quantity < 1 || quantity > MAX_BORROW_QUANTITY) {
    throw new Error("INVALID_QUANTITY");
  }
  if (book.available < quantity) {
    throw new Error("BOOK_NOT_AVAILABLE");
  }
}

function buildLoanPayload(
  book: Book,
  memberId: string,
  memberName: string,
  quantity: number,
  status: Loan["status"],
) {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

  return {
    bookId: book.id,
    bookTitle: book.title,
    memberId,
    memberName,
    quantity,
    borrowDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    returnDate: null,
    lateFee: 0,
    status,
  };
}

export async function requestBorrowBook(
  book: Book,
  memberId: string,
  memberName: string,
  quantity: number,
): Promise<Loan> {
  assertBorrowQuantity(book, quantity);
  const res = await apiClient.post<Loan>(
    "/loans",
    buildLoanPayload(book, memberId, memberName, quantity, "pending_borrow"),
  );
  return res.data;
}

export async function createStaffLoan(
  book: Book,
  memberId: string,
  memberName: string,
  quantity: number,
): Promise<Loan> {
  assertBorrowQuantity(book, quantity);
  await apiClient.patch(`/books/${book.id}`, { available: book.available - quantity });
  const res = await apiClient.post<Loan>(
    "/loans",
    buildLoanPayload(book, memberId, memberName, quantity, "borrowing"),
  );
  return res.data;
}

export async function approveBorrowBook(loan: Loan): Promise<Loan> {
  const bookRes = await apiClient.get<Book>(`/books/${loan.bookId}`);
  const book = bookRes.data;
  assertBorrowQuantity(book, loan.quantity);
  await apiClient.patch(`/books/${loan.bookId}`, {
    available: book.available - loan.quantity,
  });

  const res = await apiClient.patch<Loan>(`/loans/${loan.id}`, {
    status: "borrowing",
  });
  return res.data;
}

export async function rejectBorrowBook(loan: Loan): Promise<Loan> {
  const res = await apiClient.patch<Loan>(`/loans/${loan.id}`, {
    status: "rejected",
  });
  return res.data;
}

export async function requestReturnBook(loan: Loan): Promise<Loan> {
  const res = await apiClient.patch<Loan>(`/loans/${loan.id}`, {
    status: "return_pending",
  });
  return res.data;
}

export async function approveReturnBook(loan: Loan, lateFee: number): Promise<Loan> {
  const bookRes = await apiClient.get<Book>(`/books/${loan.bookId}`);
  const book = bookRes.data;
  await apiClient.patch(`/books/${loan.bookId}`, {
    available: Math.min(book.quantity, book.available + loan.quantity),
  });

  const res = await apiClient.patch<Loan>(`/loans/${loan.id}`, {
    returnDate: new Date().toISOString(),
    lateFee,
    status: "returned",
  });
  return res.data;
}

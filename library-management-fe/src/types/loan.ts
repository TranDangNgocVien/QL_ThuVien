export type LoanStatus =
  | "pending_borrow"
  | "borrowing"
  | "return_pending"
  | "returned"
  | "rejected";

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  lateFee?: number;
  status: LoanStatus;
}

// Trạng thái hiển thị, tính thêm "quá hạn" dựa trên dueDate so với hôm nay
export type LoanDisplayStatus =
  | "pending_borrow"
  | "borrowing"
  | "overdue"
  | "return_pending"
  | "returned"
  | "rejected";

export function getLoanDisplayStatus(loan: Loan): LoanDisplayStatus {
  if (loan.status === "pending_borrow") return "pending_borrow";
  if (loan.status === "return_pending") return "return_pending";
  if (loan.status === "returned") return "returned";
  if (loan.status === "rejected") return "rejected";
  const isOverdue = new Date(loan.dueDate).getTime() < Date.now();
  return isOverdue ? "overdue" : "borrowing";
}

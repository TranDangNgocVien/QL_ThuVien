// Hỗ trợ cả định dạng Enum của Spring Boot (viết hoa) và FE (viết thường)
export type LoanStatus =
  | "PENDING_BORROW"
  | "BORROWING"
  | "RETURN_PENDING"
  | "RETURNED"
  | "REJECTED"
  | "pending_borrow"
  | "borrowing"
  | "return_pending"
  | "returned"
  | "rejected";

export interface Loan {
  id: number | string;
  code?: string;
  bookId?: number | string;
  bookTitle?: string;
  memberId: number | string;
  memberName: string;
  quantity?: number;
  items?: LoanItem[];
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  lateFee?: number;
  status: LoanStatus;
}

export interface LoanItem {
  id?: number | string;
  loanId?: number | string;
  bookId: number | string;
  bookTitle: string;
  quantity: number;
}

export interface LoanSlipItemInput {
  bookId: string | number;
  quantity: number;
}

export interface LoanSlipInput {
  memberId?: string | number;
  borrowDate: string;
  dueDate: string;
  items: LoanSlipItemInput[];
}

export function getLoanItems(loan: Loan): LoanItem[] {
  if (loan.items && loan.items.length > 0) return loan.items;
  if (!loan.bookId || !loan.bookTitle) return [];
  return [
    {
      bookId: loan.bookId,
      bookTitle: loan.bookTitle,
      quantity: loan.quantity ?? 1,
    },
  ];
}

export function getLoanTotalQuantity(loan: Loan) {
  const items = getLoanItems(loan);
  if (items.length === 0) return loan.quantity ?? 0;
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getLoanTitleSummary(loan: Loan) {
  const items = getLoanItems(loan);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0].bookTitle;
  return `${items[0].bookTitle} +${items.length - 1}`;
}

// Trạng thái hiển thị (thêm "overdue" tính theo ngày hết hạn)
export type LoanDisplayStatus =
  | "pending_borrow"
  | "borrowing"
  | "overdue"
  | "return_pending"
  | "returned"
  | "rejected";

export function getLoanDisplayStatus(loan: Loan): LoanDisplayStatus {
  const status = loan.status?.toLowerCase();

  if (status === "pending_borrow") return "pending_borrow";
  if (status === "return_pending") return "return_pending";
  if (status === "returned") return "returned";
  if (status === "rejected") return "rejected";

  // Kiểm tra quá hạn nếu sách đang ở trạng thái mượn (borrowing)
  const isOverdue = new Date(loan.dueDate).getTime() < Date.now();
  return isOverdue ? "overdue" : "borrowing";
}

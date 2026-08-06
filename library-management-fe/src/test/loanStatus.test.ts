import { describe, expect, it } from "vitest";
import { getLoanDisplayStatus, type Loan } from "../types/loan";

function makeLoan(overrides: Partial<Loan>): Loan {
  return {
    id: "1",
    bookId: "b1",
    bookTitle: "Sách mẫu",
    memberId: "m1",
    quantity: 1,
    memberName: "Khách mẫu",
    borrowDate: "2026-01-01T00:00:00.000Z",
    dueDate: "2026-01-15T00:00:00.000Z",
    returnDate: null,
    status: "borrowing",
    ...overrides,
  };
}

describe("getLoanDisplayStatus", () => {
  it("returns 'returned' when the loan has already been returned", () => {
    const loan = makeLoan({ status: "returned", returnDate: "2026-01-10T00:00:00.000Z" });
    expect(getLoanDisplayStatus(loan)).toBe("returned");
  });

  it("returns 'overdue' when still borrowing and past the due date", () => {
    const loan = makeLoan({ dueDate: "2020-01-01T00:00:00.000Z" });
    expect(getLoanDisplayStatus(loan)).toBe("overdue");
  });

  it("returns 'borrowing' when still within the due date", () => {
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const loan = makeLoan({ dueDate: farFuture });
    expect(getLoanDisplayStatus(loan)).toBe("borrowing");
  });

  it("keeps pending borrow requests separate from active loans", () => {
    const loan = makeLoan({ status: "pending_borrow" });
    expect(getLoanDisplayStatus(loan)).toBe("pending_borrow");
  });

  it("keeps pending return requests separate from returned loans", () => {
    const loan = makeLoan({ status: "return_pending" });
    expect(getLoanDisplayStatus(loan)).toBe("return_pending");
  });
});

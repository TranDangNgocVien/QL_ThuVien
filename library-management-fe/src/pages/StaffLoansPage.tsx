import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { useLoans } from "../hooks/useLoans";
import { useMembers } from "../hooks/useMembers";
import { fetchAllBooks } from "../api/booksApi";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Input, Label } from "../components/ui/input";
import { startsWithSearch } from "../lib/search";
import {
  getLoanDisplayStatus,
  getLoanItems,
  getLoanTitleSummary,
  getLoanTotalQuantity,
  type Loan,
  type LoanDisplayStatus,
} from "../types/loan";
import type { LoanQueryParams } from "../api/loansApi";

const MAX_SLIP_BOOKS = 3;

const statusStyles: Record<LoanDisplayStatus, string> = {
  pending_borrow: "border-brass text-brass",
  borrowing: "border-moss text-moss",
  overdue: "border-rust text-rust",
  return_pending: "border-brass text-brass",
  returned: "border-ink/30 text-ink/60",
  rejected: "border-rust text-rust",
};

const filterOptions: { value: NonNullable<LoanQueryParams["status"]>; labelKey: string }[] = [
  { value: "all", labelKey: "loans.filterAll" },
  { value: "pending_borrow", labelKey: "loans.filterPendingBorrow" },
  { value: "borrowing", labelKey: "loans.filterBorrowing" },
  { value: "return_pending", labelKey: "loans.filterReturnPending" },
  { value: "returned", labelKey: "loans.filterReturned" },
];

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function idsEqual(left: string | number, right: string | number) {
  return String(left) === String(right);
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function StaffLoansPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] =
    useState<NonNullable<LoanQueryParams["status"]>>("all");

  const {
    loans,
    isLoading,
    createStaffLoanSlip,
    approveBorrowBook,
    rejectBorrowBook,
    approveReturnBook,
    isMutating,
  } = useLoans({ status: statusFilter });
  const { members } = useMembers();
  const activeMembers = members.filter((m) => m.status.toLowerCase() === "active");

  const booksQuery = useQuery({ queryKey: ["all-books"], queryFn: fetchAllBooks });
  const availableBooks = useMemo(
    () => (booksQuery.data ?? []).filter((b) => b.available > 0),
    [booksQuery.data],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<(string | number)[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [borrowDate, setBorrowDate] = useState(toDateInputValue(new Date()));
  const [dueDate, setDueDate] = useState(toDateInputValue(addDays(new Date(), 14)));
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [returnLoan, setReturnLoan] = useState<Loan | null>(null);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [lateFee, setLateFee] = useState(0);

  const selectedBooks = availableBooks.filter((book) =>
    selectedBookIds.some((id) => idsEqual(id, book.id)),
  );
  const today = toDateInputValue(new Date());
  const filteredMembers = activeMembers.filter((member) => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return true;
    return [member.fullName, member.phone, member.email, member.cardNumber ?? ""]
      .some((value) => startsWithSearch(value, keyword));
  });
  const filteredBooks = availableBooks.filter((book) => {
    const keyword = bookSearch.trim().toLowerCase();
    if (!keyword) return true;
    return [book.title, book.author, String(book.id)]
      .some((value) => startsWithSearch(value, keyword));
  });

  const openDialog = () => {
    setSelectedMemberId(activeMembers[0] ? String(activeMembers[0].id) : "");
    setSelectedBookIds([]);
    setMemberSearch("");
    setBookSearch("");
    setBorrowDate(toDateInputValue(new Date()));
    setDueDate(toDateInputValue(addDays(new Date(), 14)));
    setDialogOpen(true);
  };

  const toggleStaffBook = (bookId: string | number, checked: boolean) => {
    setSelectedBookIds((current) => {
      if (!checked) return current.filter((id) => !idsEqual(id, bookId));
      if (current.some((id) => idsEqual(id, bookId))) return current;
      return [...current, bookId];
    });
  };

  const handleCreateLoan = async () => {
    const member = activeMembers.find((m) => idsEqual(m.id, selectedMemberId));
    if (!member || selectedBooks.length === 0) return;
    if (selectedBooks.length > MAX_SLIP_BOOKS) {
      toast.error(t("loans.maxSelectionError", { max: MAX_SLIP_BOOKS }));
      return;
    }
    if (borrowDate < today) {
      toast.error(t("loans.borrowDatePastError"));
      return;
    }
    if (dueDate < borrowDate) {
      toast.error(t("loans.dueDateInvalid"));
      return;
    }
    try {
      await createStaffLoanSlip({
        memberId: member.id,
        borrowDate,
        dueDate,
        items: selectedBooks.map((book) => ({ bookId: book.id, quantity: 1 })),
      });
      toast.success(t("loans.createSuccess"));
      setDialogOpen(false);
    } catch {
      toast.error(t("loans.createError"));
    }
  };

  const handleApproveBorrow = async (loan: Loan) => {
    setBusyId(loan.id);
    try {
      await approveBorrowBook(loan);
      toast.success(t("loans.approveBorrowSuccess"));
    } catch {
      toast.error(t("loans.approveBorrowError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectBorrow = async (loan: Loan) => {
    setBusyId(loan.id);
    try {
      await rejectBorrowBook(loan);
      toast.success(t("loans.rejectBorrowSuccess"));
    } catch {
      toast.error(t("loans.rejectBorrowError"));
    } finally {
      setBusyId(null);
    }
  };

  const openReturnDialog = (loan: Loan) => {
    setReturnLoan(loan);
    setLateFee(0);
  };

  const handleApproveReturn = async () => {
    if (!returnLoan) return;
    setBusyId(returnLoan.id);
    try {
      await approveReturnBook({ loan: returnLoan, lateFee });
      toast.success(t("loans.returnSuccess"));
      setReturnLoan(null);
    } catch {
      toast.error(t("loans.returnError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-stacks-dark">
            {t("loans.title")}
          </h2>
          <p className="text-sm text-ink/60">{t("loans.subtitle")}</p>
        </div>
        <Button size="sm" onClick={openDialog}>
          <Plus size={14} /> {t("loans.newLoan")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`focus-ring rounded-xl px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
              statusFilter === opt.value
                ? "bg-stacks text-paper"
                : "border border-stacks/30 text-stacks hover:bg-stacks/5"
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="catalog-card p-8 text-center text-sm text-ink/60">
          {t("table.loading")}
        </div>
      ) : loans.length === 0 ? (
        <div className="catalog-card bg-card-lines p-10 text-center text-sm text-ink/60">
          {t("loans.empty")}
        </div>
      ) : (
        <div className="catalog-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-stacks text-paper">
                <th className="px-4 py-3 font-display text-sm font-semibold">
                  {t("loans.book")}
                </th>
                <th className="px-4 py-3 font-display text-sm font-semibold">
                  {t("loans.member")}
                </th>
                <th className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wide">
                  {t("loans.quantity")}
                </th>
                <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wide sm:table-cell">
                  {t("myLoans.borrowDate")}
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">
                  {t("myLoans.dueDate")}
                </th>
                <th className="hidden px-4 py-3 text-right font-display text-sm font-semibold md:table-cell">
                  {t("myLoans.lateFee")}
                </th>
                <th className="px-4 py-3 text-center font-display text-sm font-semibold">
                  {t("myLoans.status")}
                </th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold">
                  {t("myLoans.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const displayStatus = getLoanDisplayStatus(loan);
                return (
                  <tr
                    key={loan.id}
                    className="border-b border-dashed border-paper-line last:border-0 hover:bg-brass/5"
                  >
                    <td className="px-4 py-3 font-display font-medium text-ink">
                      {getLoanTitleSummary(loan)}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{loan.memberName}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink/70">
                      {getLoanTotalQuantity(loan)}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-ink/70 sm:table-cell">
                      {formatDate(loan.borrowDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink/70">
                      {formatDate(loan.dueDate)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-ink/70 md:table-cell">
                      {(loan.lateFee ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`stamp-badge ${statusStyles[displayStatus]}`}>
                        {t(`loanStatus.${displayStatus}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {displayStatus === "pending_borrow" && (
                          <>
                            <Button
                              size="sm"
                              disabled={isMutating || idsEqual(busyId ?? "", loan.id)}
                              onClick={() => handleApproveBorrow(loan)}
                            >
                              <Check size={14} />
                              {t("loans.approveBorrow")}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isMutating || idsEqual(busyId ?? "", loan.id)}
                              onClick={() => handleRejectBorrow(loan)}
                            >
                              <X size={14} />
                              {t("loans.rejectBorrow")}
                            </Button>
                          </>
                        )}
                        {displayStatus === "return_pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isMutating || idsEqual(busyId ?? "", loan.id)}
                            onClick={() => openReturnDialog(loan)}
                          >
                            {t("loans.approveReturn")}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDetailLoan(loan)}>
                          {t("loans.viewDetail")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={t("loans.newLoan")}>
        <div className="space-y-4">
          <div>
            <Label>{t("loans.member")}</Label>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-rust">{t("loans.noEligibleMembers")}</p>
            ) : (
              <div className="space-y-2">
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={t("loans.searchMemberPlaceholder")}
                />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="focus-ring h-10 w-full rounded-xl border border-paper-line bg-white px-3 text-sm text-ink"
                >
                  {filteredMembers.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.fullName} - {m.cardNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <Label>{t("loans.book")}</Label>
            {availableBooks.length === 0 ? (
              <p className="text-sm text-rust">{t("loans.noEligibleBooks")}</p>
            ) : (
              <div className="space-y-2">
                <Input
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder={t("loans.searchBookPlaceholder")}
                />
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-paper-line bg-white p-2">
                  {filteredBooks.map((b) => (
                    <label
                      key={b.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-brass/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBookIds.some((id) => idsEqual(id, b.id))}
                        onChange={(e) => toggleStaffBook(b.id, e.target.checked)}
                        className="h-5 w-5 rounded border-paper-line accent-stacks"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{b.title}</span>
                      <span className="font-mono text-xs text-ink/60">
                        {b.available}/{b.quantity}
                      </span>
                    </label>
                  ))}
                  {filteredBooks.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-ink/60">
                      {t("loans.noSearchResults")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="staffBorrowDate">{t("loans.borrowDateInput")}</Label>
              <Input
                id="staffBorrowDate"
                type="date"
                min={today}
                value={borrowDate}
                onChange={(e) => {
                  setBorrowDate(e.target.value);
                  if (dueDate < e.target.value) setDueDate(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="staffDueDate">{t("loans.dueDateInput")}</Label>
              <Input
                id="staffDueDate"
                type="date"
                min={borrowDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-ink/50">
            {t("loans.selectedForSlip", { count: selectedBooks.length, max: MAX_SLIP_BOOKS })}
          </p>
          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t("form.cancel")}
            </Button>
            <Button
              disabled={
                isMutating ||
                activeMembers.length === 0 ||
                availableBooks.length === 0 ||
                selectedBooks.length === 0 ||
                !borrowDate ||
                !dueDate ||
                borrowDate < today ||
                new Date(dueDate).getTime() < new Date(borrowDate).getTime()
              }
              onClick={handleCreateLoan}
            >
              {isMutating ? t("loans.creating") : t("loans.create")}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!returnLoan}
        onClose={() => setReturnLoan(null)}
        title={t("loans.approveReturn")}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-paper-line bg-paper p-3 text-sm text-ink/70">
            <div className="font-display font-medium text-ink">
              {returnLoan ? getLoanTitleSummary(returnLoan) : ""}
            </div>
            <div className="mt-1">
              {t("loans.returnInfo", {
                dueDate: formatDate(returnLoan?.dueDate ?? null),
                quantity: returnLoan ? getLoanTotalQuantity(returnLoan) : 1,
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="lateFee">{t("loans.lateFeeInput")}</Label>
            <Input
              id="lateFee"
              type="number"
              min={0}
              value={lateFee}
              onChange={(e) => setLateFee(Math.max(0, Number(e.target.value) || 0))}
            />
            <p className="mt-1 text-xs text-ink/50">{t("loans.lateFeeHint")}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button variant="ghost" onClick={() => setReturnLoan(null)}>
              {t("form.cancel")}
            </Button>
            <Button disabled={isMutating} onClick={handleApproveReturn}>
              {isMutating ? t("loans.creating") : t("loans.confirmReturn")}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!detailLoan}
        onClose={() => setDetailLoan(null)}
        title={t("loans.detailTitle")}
      >
        {detailLoan && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-paper-line bg-paper p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">{t("loans.code")}</dt>
                <dd className="mt-1 font-mono text-ink">{detailLoan.code ?? detailLoan.id}</dd>
              </div>
              <div className="rounded-lg border border-paper-line bg-paper p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">{t("loans.member")}</dt>
                <dd className="mt-1 text-ink">{detailLoan.memberName}</dd>
              </div>
              <div className="rounded-lg border border-paper-line bg-paper p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">{t("myLoans.borrowDate")}</dt>
                <dd className="mt-1 font-mono text-ink">{formatDate(detailLoan.borrowDate)}</dd>
              </div>
              <div className="rounded-lg border border-paper-line bg-paper p-3">
                <dt className="text-xs font-medium uppercase text-ink/50">{t("myLoans.dueDate")}</dt>
                <dd className="mt-1 font-mono text-ink">{formatDate(detailLoan.dueDate)}</dd>
              </div>
            </dl>
            <div className="rounded-xl border border-paper-line bg-white">
              {getLoanItems(detailLoan).map((item) => (
                <div
                  key={`${item.bookId}-${item.id ?? ""}`}
                  className="flex justify-between gap-3 border-b border-dashed border-paper-line px-4 py-3 last:border-0"
                >
                  <span className="font-display font-medium text-ink">{item.bookTitle}</span>
                  <span className="font-mono text-ink/70">
                    {t("loans.quantity")}: {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

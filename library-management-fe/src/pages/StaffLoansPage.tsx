import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { useLoans } from "../hooks/useLoans";
import { useMembers } from "../hooks/useMembers";
import { fetchAllBooks } from "../api/booksApi";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Dialog } from "../components/ui/dialog";
import { Input, Label } from "../components/ui/input";
import { getLoanDisplayStatus, type Loan, type LoanDisplayStatus } from "../types/loan";
import type { LoanQueryParams } from "../api/loansApi";

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

export default function StaffLoansPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] =
    useState<NonNullable<LoanQueryParams["status"]>>("all");

  const {
    loans,
    isLoading,
    createStaffLoan,
    approveBorrowBook,
    rejectBorrowBook,
    approveReturnBook,
    isMutating,
  } = useLoans({ status: statusFilter });
  const { members } = useMembers();
  const activeMembers = members.filter((m) => m.status === "active");

  const booksQuery = useQuery({ queryKey: ["all-books"], queryFn: fetchAllBooks });
  const availableBooks = useMemo(
    () => (booksQuery.data ?? []).filter((b) => b.available > 0),
    [booksQuery.data],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [returnLoan, setReturnLoan] = useState<Loan | null>(null);
  const [lateFee, setLateFee] = useState(0);

  const selectedBook = availableBooks.find((b) => b.id === selectedBookId);

  const openDialog = () => {
    setSelectedMemberId(activeMembers[0]?.id ?? "");
    setSelectedBookId(availableBooks[0]?.id ?? "");
    setSelectedQuantity(1);
    setDialogOpen(true);
  };

  const handleCreateLoan = async () => {
    const member = activeMembers.find((m) => m.id === selectedMemberId);
    const book = availableBooks.find((b) => b.id === selectedBookId);
    if (!member || !book) return;
    try {
      await createStaffLoan({
        book,
        memberId: member.id,
        memberName: member.fullName,
        quantity: selectedQuantity,
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
                      {loan.bookTitle}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{loan.memberName}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink/70">
                      {loan.quantity}
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
                              disabled={isMutating || busyId === loan.id}
                              onClick={() => handleApproveBorrow(loan)}
                            >
                              <Check size={14} />
                              {t("loans.approveBorrow")}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isMutating || busyId === loan.id}
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
                            disabled={isMutating || busyId === loan.id}
                            onClick={() => openReturnDialog(loan)}
                          >
                            {t("loans.approveReturn")}
                          </Button>
                        )}
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
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} - {m.cardNumber}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Label>{t("loans.book")}</Label>
            {availableBooks.length === 0 ? (
              <p className="text-sm text-rust">{t("loans.noEligibleBooks")}</p>
            ) : (
              <Select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.available}/{b.quantity})
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="loanQuantity">{t("loans.quantity")}</Label>
            <Input
              id="loanQuantity"
              type="number"
              min={1}
              max={Math.min(3, selectedBook?.available ?? 1)}
              value={selectedQuantity}
              onChange={(e) => {
                const value = Number(e.target.value);
                setSelectedQuantity(Math.max(1, Math.min(3, value || 1)));
              }}
            />
            <p className="mt-1 text-xs text-ink/50">{t("loans.quantityHint")}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t("form.cancel")}
            </Button>
            <Button
              disabled={
                isMutating ||
                activeMembers.length === 0 ||
                availableBooks.length === 0 ||
                selectedQuantity > (selectedBook?.available ?? 0)
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
            <div className="font-display font-medium text-ink">{returnLoan?.bookTitle}</div>
            <div className="mt-1">
              {t("loans.returnInfo", {
                dueDate: formatDate(returnLoan?.dueDate ?? null),
                quantity: returnLoan?.quantity ?? 1,
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
    </div>
  );
}

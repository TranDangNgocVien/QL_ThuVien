import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useLoans } from "../hooks/useLoans";
import { fetchMemberByUserId } from "../api/membersApi";
import { Button } from "../components/ui/button";
import { getLoanDisplayStatus, type Loan, type LoanDisplayStatus } from "../types/loan";

const statusStyles: Record<LoanDisplayStatus, string> = {
  pending_borrow: "border-brass text-brass",
  borrowing: "border-moss text-moss",
  overdue: "border-rust text-rust",
  return_pending: "border-brass text-brass",
  returned: "border-ink/30 text-ink/60",
  rejected: "border-rust text-rust",
};

export default function MyLoansPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const memberQuery = useQuery({
    queryKey: ["member-by-user", user?.id],
    queryFn: () => fetchMemberByUserId(user!.id),
    enabled: !!user,
  });
  const member = memberQuery.data ?? null;

  const { loans, isLoading, requestReturnBook, isMutating } = useLoans({
    memberId: member?.id,
  });

  const [returningId, setReturningId] = useState<string | null>(null);

  const handleReturn = async (loan: Loan) => {
    setReturningId(loan.id);
    try {
      await requestReturnBook(loan);
      toast.success(t("myLoans.returnRequestSuccess"));
    } catch {
      toast.error(t("myLoans.returnError"));
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-stacks-dark">
          {t("myLoans.title")}
        </h2>
        <p className="text-sm text-ink/60">{t("myLoans.subtitle")}</p>
      </div>

      {isLoading || memberQuery.isLoading ? (
        <div className="catalog-card p-8 text-center text-sm text-ink/60">
          {t("table.loading")}
        </div>
      ) : loans.length === 0 ? (
        <div className="catalog-card bg-card-lines p-10 text-center text-sm text-ink/60">
          {t("myLoans.empty")}
        </div>
      ) : (
        <div className="catalog-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-stacks text-paper">
                <th className="px-4 py-3 font-display text-sm font-semibold">
                  {t("myLoans.book")}
                </th>
                <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wide sm:table-cell">
                  {t("myLoans.borrowDate")}
                </th>
                <th className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wide">
                  {t("myLoans.quantity")}
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">
                  {t("myLoans.dueDate")}
                </th>
                <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wide sm:table-cell">
                  {t("myLoans.returnDate")}
                </th>
                <th className="px-4 py-3 text-center font-display text-sm font-semibold">
                  {t("myLoans.status")}
                </th>
                <th className="hidden px-4 py-3 text-right font-display text-sm font-semibold md:table-cell">
                  {t("myLoans.lateFee")}
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
                    <td className="hidden px-4 py-3 font-mono text-ink/70 sm:table-cell">
                      {new Date(loan.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-ink/70">
                      {loan.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink/70">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-ink/70 sm:table-cell">
                      {loan.returnDate
                        ? new Date(loan.returnDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`stamp-badge ${statusStyles[displayStatus]}`}
                      >
                        {t(`loanStatus.${displayStatus}`)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-ink/70 md:table-cell">
                      {(loan.lateFee ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(displayStatus === "borrowing" || displayStatus === "overdue") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isMutating}
                          onClick={() => handleReturn(loan)}
                        >
                          {returningId === loan.id
                            ? t("myLoans.returning")
                            : t("myLoans.returnBook")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

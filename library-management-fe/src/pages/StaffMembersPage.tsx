import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { IdCard } from "lucide-react";
import { useMembers } from "../hooks/useMembers";
import { Button } from "../components/ui/button";
import type { Member, MemberStatus } from "../types/member";

const statusStyles: Record<MemberStatus, string> = {
  pending: "border-brass text-brass",
  active: "border-moss text-moss",
  suspended: "border-rust text-rust",
};

export default function StaffMembersPage() {
  const { t } = useTranslation();
  const { members, isLoading, issueCard, setMemberStatus, isMutating } = useMembers();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleIssueCard = async (member: Member) => {
    setBusyId(member.id);
    try {
      await issueCard(member.id);
      toast.success(t("members.issueSuccess"));
    } catch {
      toast.error(t("members.issueError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (member: Member) => {
    setBusyId(member.id);
    try {
      await setMemberStatus({
        memberId: member.id,
        status: member.status === "suspended" ? "active" : "suspended",
      });
      toast.success(t("members.statusUpdateSuccess"));
    } catch {
      toast.error(t("members.statusUpdateError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-stacks-dark">
          {t("members.title")}
        </h2>
        <p className="text-sm text-ink/60">{t("members.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="catalog-card p-8 text-center text-sm text-ink/60">
          {t("table.loading")}
        </div>
      ) : members.length === 0 ? (
        <div className="catalog-card bg-card-lines p-10 text-center text-sm text-ink/60">
          {t("members.empty")}
        </div>
      ) : (
        <div className="catalog-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-stacks text-paper">
                <th className="px-4 py-3 font-display text-sm font-semibold">
                  {t("members.fullName")}
                </th>
                <th className="hidden px-4 py-3 font-display text-sm font-semibold sm:table-cell">
                  {t("members.phone")}
                </th>
                <th className="hidden px-4 py-3 font-display text-sm font-semibold md:table-cell">
                  {t("members.email")}
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide">
                  {t("members.cardNumber")}
                </th>
                <th className="px-4 py-3 text-center font-display text-sm font-semibold">
                  {t("members.status")}
                </th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold">
                  {t("members.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-dashed border-paper-line last:border-0 hover:bg-brass/5"
                >
                  <td className="px-4 py-3">
                    <div className="font-display font-medium text-ink">
                      {member.fullName}
                    </div>
                    <div className="text-xs text-ink/50 sm:hidden">
                      {member.phone}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink/80 sm:table-cell">
                    {member.phone}
                  </td>
                  <td className="hidden px-4 py-3 text-ink/80 md:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/70">
                    {member.cardNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`stamp-badge ${statusStyles[member.status]}`}>
                      {t(`memberStatus.${member.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.status === "pending" ? (
                      <Button
                        size="sm"
                        disabled={isMutating}
                        onClick={() => handleIssueCard(member)}
                      >
                        <IdCard size={14} />
                        {busyId === member.id
                          ? t("members.issuing")
                          : t("members.issueCard")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={member.status === "suspended" ? "secondary" : "danger"}
                        disabled={isMutating}
                        onClick={() => handleToggleStatus(member)}
                      >
                        {member.status === "suspended"
                          ? t("members.activate")
                          : t("members.suspend")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { IdCard, Pencil, Trash2, UserPlus } from "lucide-react";
import { useMembers } from "../hooks/useMembers";
import { Button } from "../components/ui/button";
import { ConfirmDialog, Dialog } from "../components/ui/dialog";
import { FieldError, Input, Label } from "../components/ui/input";
import { Select } from "../components/ui/select";
import type { RegisterInput } from "../types/auth";
import type { Member, MemberStatus } from "../types/member";

const statusStyles: Record<MemberStatus, string> = {
  PENDING: "border-brass text-brass",
  ACTIVE: "border-moss text-moss",
  SUSPENDED: "border-rust text-rust",
  BLOCKED: "border-rust text-rust",
  pending: "border-brass text-brass",
  active: "border-moss text-moss",
  suspended: "border-rust text-rust",
  blocked: "border-rust text-rust",
};

function buildReaderSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().min(1, t("auth.errors.fullNameRequired")),
    phone: z.string().min(8, t("auth.errors.phoneInvalid")),
    email: z.string().email(t("auth.errors.emailInvalid")),
    username: z.string().min(3, t("auth.errors.usernameMin")),
    password: z.string().min(4, t("auth.errors.passwordMin")),
    confirmPassword: z.string().min(1, t("auth.errors.confirmPasswordRequired")),
  }).refine((values) => values.password === values.confirmPassword, {
    message: t("auth.errors.passwordMismatch"),
    path: ["confirmPassword"],
  });
}

type ReaderFormValues = RegisterInput & {
  confirmPassword: string;
};

function buildEditSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().min(1, t("auth.errors.fullNameRequired")),
    phone: z.string().min(8, t("auth.errors.phoneInvalid")),
    email: z.string().email(t("auth.errors.emailInvalid")),
    cardNumber: z.string().optional(),
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"]),
  });
}

type EditMemberValues = z.infer<ReturnType<typeof buildEditSchema>>;

export default function StaffMembersPage() {
  const { t } = useTranslation();
  const {
    members,
    isLoading,
    createReaderAccount,
    updateMember,
    deleteMember,
    issueCard,
    setMemberStatus,
    isMutating,
  } = useMembers();
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showReaderPassword, setShowReaderPassword] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const schema = buildReaderSchema(t);
  const editSchema = buildEditSchema(t);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReaderFormValues>({ resolver: zodResolver(schema) });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<EditMemberValues>({ resolver: zodResolver(editSchema) });

  const handleCreateReader = handleSubmit(async (values) => {
    setCreateError(null);
    try {
      const { confirmPassword: _confirmPassword, ...registerValues } = values;
      await createReaderAccount(registerValues);
      toast.success(t("members.createAccountSuccess"));
      reset();
      setShowReaderPassword(false);
      setCreateOpen(false);
    } catch {
      setCreateError(t("members.createAccountError"));
    }
  });

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
        status: member.status.toLowerCase() === "suspended" ? "ACTIVE" : "SUSPENDED",
      });
      toast.success(t("members.statusUpdateSuccess"));
    } catch {
      toast.error(t("members.statusUpdateError"));
    } finally {
      setBusyId(null);
    }
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    resetEdit({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      cardNumber: member.cardNumber ?? "",
      status: member.status.toUpperCase() as EditMemberValues["status"],
    });
  };

  const handleUpdateMember = handleEditSubmit(async (values) => {
    if (!editingMember) return;
    try {
      await updateMember({
        memberId: editingMember.id,
        input: {
          ...values,
          cardNumber: values.cardNumber?.trim() || null,
        },
      });
      toast.success(t("members.updateSuccess"));
      setEditingMember(null);
    } catch {
      toast.error(t("members.updateError"));
    }
  });

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      await deleteMember(deletingMember.id);
      toast.success(t("members.deleteSuccess"));
      setDeletingMember(null);
    } catch {
      toast.error(t("members.deleteError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-stacks-dark">
            {t("members.title")}
          </h2>
          <p className="text-sm text-ink/60">{t("members.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus size={14} />
          {t("members.createAccount")}
        </Button>
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
                      {t(`memberStatus.${member.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {member.status.toLowerCase() === "pending" ? (
                        <Button
                          size="sm"
                          disabled={isMutating}
                          onClick={() => handleIssueCard(member)}
                        >
                          <IdCard size={14} />
                          {String(busyId) === String(member.id)
                            ? t("members.issuing")
                            : t("members.issueCard")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={member.status.toLowerCase() === "suspended" ? "secondary" : "danger"}
                          disabled={isMutating}
                          onClick={() => handleToggleStatus(member)}
                        >
                          {member.status.toLowerCase() === "suspended"
                            ? t("members.activate")
                            : t("members.suspend")}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("table.edit")}
                        disabled={isMutating}
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("table.delete")}
                        disabled={isMutating}
                        onClick={() => setDeletingMember(member)}
                      >
                        <Trash2 size={15} className="text-rust" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("members.createAccount")}
      >
        <form onSubmit={handleCreateReader} className="space-y-4">
          <div>
            <Label htmlFor="readerFullName">{t("auth.fullName")}</Label>
            <Input id="readerFullName" {...register("fullName")} autoFocus />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="readerPhone">{t("auth.phone")}</Label>
              <Input id="readerPhone" {...register("phone")} />
              <FieldError>{errors.phone?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="readerEmail">{t("auth.email")}</Label>
              <Input id="readerEmail" type="email" {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="readerUsername">{t("auth.username")}</Label>
              <Input id="readerUsername" {...register("username")} />
              <FieldError>{errors.username?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="readerPassword">{t("auth.password")}</Label>
              <Input
                id="readerPassword"
                type={showReaderPassword ? "text" : "password"}
                {...register("password")}
              />
              <FieldError>{errors.password?.message}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="readerConfirmPassword">{t("auth.confirmPassword")}</Label>
            <Input
              id="readerConfirmPassword"
              type={showReaderPassword ? "text" : "password"}
              {...register("confirmPassword")}
            />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-stacks-dark">
            <input
              type="checkbox"
              checked={showReaderPassword}
              onChange={(e) => setShowReaderPassword(e.target.checked)}
              className="h-5 w-5 rounded border-paper-line accent-stacks"
            />
            {t("auth.showPassword")}
          </label>

          <FieldError>{createError ?? undefined}</FieldError>

          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isMutating || isSubmitting}>
              {isMutating || isSubmitting
                ? t("members.creatingAccount")
                : t("members.createAccount")}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!editingMember}
        onClose={() => setEditingMember(null)}
        title={t("members.editTitle")}
      >
        <form onSubmit={handleUpdateMember} className="space-y-4">
          <div>
            <Label htmlFor="editFullName">{t("auth.fullName")}</Label>
            <Input id="editFullName" {...registerEdit("fullName")} autoFocus />
            <FieldError>{editErrors.fullName?.message}</FieldError>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="editPhone">{t("auth.phone")}</Label>
              <Input id="editPhone" {...registerEdit("phone")} />
              <FieldError>{editErrors.phone?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="editEmail">{t("auth.email")}</Label>
              <Input id="editEmail" type="email" {...registerEdit("email")} />
              <FieldError>{editErrors.email?.message}</FieldError>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="editCardNumber">{t("members.cardNumber")}</Label>
              <Input id="editCardNumber" {...registerEdit("cardNumber")} />
              <FieldError>{editErrors.cardNumber?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="editStatus">{t("members.status")}</Label>
              <Select id="editStatus" {...registerEdit("status")}>
                <option value="PENDING">{t("memberStatus.pending")}</option>
                <option value="ACTIVE">{t("memberStatus.active")}</option>
                <option value="SUSPENDED">{t("memberStatus.suspended")}</option>
                <option value="BLOCKED">{t("memberStatus.blocked")}</option>
              </Select>
              <FieldError>{editErrors.status?.message}</FieldError>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isMutating || isEditSubmitting}>
              {isMutating || isEditSubmitting ? t("form.saving") : t("form.save")}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deletingMember}
        title={t("members.deleteTitle")}
        body={t("members.deleteBody")}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.cancel")}
        isLoading={isMutating}
        onConfirm={handleDeleteMember}
        onCancel={() => setDeletingMember(null)}
      />
    </div>
  );
}

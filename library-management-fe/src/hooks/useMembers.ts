import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReaderAccount,
  deleteMember,
  fetchMembers,
  fetchMyMemberProfile,
  issueCard,
  setMemberStatus,
  updateMember,
  type UpdateMemberInput,
} from "../api/membersApi";
import type { RegisterInput } from "../types/auth";
import type { MemberStatus } from "../types/member";

/**
 * Quản lý danh sách thành viên (Dành cho Thủ thư)
 */
export function useMembers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 10_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["members"] });
    queryClient.invalidateQueries({ queryKey: ["my-member-profile"] });
  };

  const issueCardMutation = useMutation({
    mutationFn: (memberId: string | number) => issueCard(memberId),
    onSuccess: invalidate,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string | number;
      status: MemberStatus;
    }) => setMemberStatus(memberId, status),
    onSuccess: invalidate,
  });

  const createReaderMutation = useMutation({
    mutationFn: (input: RegisterInput) => createReaderAccount(input),
    onSuccess: invalidate,
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({
      memberId,
      input,
    }: {
      memberId: string | number;
      input: UpdateMemberInput;
    }) => updateMember(memberId, input),
    onSuccess: invalidate,
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberId: string | number) => deleteMember(memberId),
    onSuccess: invalidate,
  });

  return {
    ...query,
    members: query.data ?? [],
    createReaderAccount: createReaderMutation.mutateAsync,
    updateMember: updateMemberMutation.mutateAsync,
    deleteMember: deleteMemberMutation.mutateAsync,
    issueCard: issueCardMutation.mutateAsync,
    setMemberStatus: setStatusMutation.mutateAsync,
    isMutating:
      createReaderMutation.isPending ||
      updateMemberMutation.isPending ||
      deleteMemberMutation.isPending ||
      issueCardMutation.isPending ||
      setStatusMutation.isPending,
  };
}

/**
 * Lấy thông tin hồ sơ thẻ của độc giả đang đăng nhập
 */
export function useMyMemberProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const query = useQuery({
    queryKey: ["my-member-profile"],
    queryFn: fetchMyMemberProfile,
    enabled: !!token, // Chỉ kích hoạt request khi có token
    staleTime: 10_000,
  });

  return {
    ...query,
    member: query.data ?? null,
  };
}

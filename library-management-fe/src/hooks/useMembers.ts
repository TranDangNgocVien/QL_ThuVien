import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMembers, issueCard, setMemberStatus } from "../api/membersApi";
import type { MemberStatus } from "../types/member";

export function useMembers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 10_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["members"] });

  const issueCardMutation = useMutation({
    mutationFn: (memberId: string) => issueCard(memberId),
    onSuccess: invalidate,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: MemberStatus }) =>
      setMemberStatus(memberId, status),
    onSuccess: invalidate,
  });

  return {
    ...query,
    members: query.data ?? [],
    issueCard: issueCardMutation.mutateAsync,
    setMemberStatus: setStatusMutation.mutateAsync,
    isMutating: issueCardMutation.isPending || setStatusMutation.isPending,
  };
}

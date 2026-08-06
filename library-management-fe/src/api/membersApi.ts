import { apiClient } from "./client";
import type { Member, MemberStatus } from "../types/member";

export async function fetchMembers(): Promise<Member[]> {
  const res = await apiClient.get<Member[]>("/members", {
    params: { _sort: "fullName" },
  });
  return res.data;
}

export async function fetchMemberByUserId(userId: string): Promise<Member | null> {
  const res = await apiClient.get<Member[]>("/members", { params: { userId } });
  return res.data[0] ?? null;
}

function generateCardNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `TV-${year}-${suffix}`;
}

// Thủ thư cấp thẻ thư viện cho khách hàng (bắt buộc trước khi mượn sách)
export async function issueCard(memberId: string): Promise<Member> {
  const res = await apiClient.patch<Member>(`/members/${memberId}`, {
    cardNumber: generateCardNumber(),
    status: "active" as MemberStatus,
    issuedDate: new Date().toISOString(),
  });
  return res.data;
}

export async function setMemberStatus(
  memberId: string,
  status: MemberStatus,
): Promise<Member> {
  const res = await apiClient.patch<Member>(`/members/${memberId}`, { status });
  return res.data;
}

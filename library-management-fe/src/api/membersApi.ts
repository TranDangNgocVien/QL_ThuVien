import { apiClient } from "./client";
import { registerCustomer } from "./authApi";
import type { RegisterInput } from "../types/auth";
import type { Member, MemberStatus } from "../types/member";

function encodePathId(id: string | number) {
  return encodeURIComponent(String(id));
}

/**
 * Lấy danh sách tất cả hồ sơ Member (Dành cho Thủ thư)
 */
export async function fetchMembers(): Promise<Member[]> {
  const res = await apiClient.get<Member[]>("/members");
  return res.data;
}

function pickMemberId(raw: unknown): string | number | undefined {
  const data = (raw ?? {}) as Record<string, any>;
  const looksLikeMember =
    "status" in data || "cardNumber" in data || "issuedDate" in data;
  return (
    data.memberId ??
    data.member?.id ??
    data.user?.memberId ??
    data.user?.member?.id ??
    (looksLikeMember ? data.id : undefined)
  );
}

function sameCreatedReader(member: Member, input: RegisterInput) {
  return (
    member.email?.toLowerCase() === input.email.toLowerCase() ||
    member.phone === input.phone
  );
}

export async function createReaderAccount(input: RegisterInput): Promise<Member> {
  const registered = await registerCustomer(input);
  let memberId = pickMemberId(registered);

  if (!memberId) {
    const members = await fetchMembers();
    memberId = members.find((member) => sameCreatedReader(member, input))?.id;
  }

  if (!memberId) {
    throw new Error("MEMBER_NOT_FOUND_AFTER_REGISTER");
  }

  return issueCard(memberId);
}

/**
 * Lấy thông tin hồ sơ của chính người dùng hiện tại
 * Backend tự giải mã từ JWT Token, không cần truyền userId/memberId
 */
export async function fetchMyMemberProfile(): Promise<Member> {
  const res = await apiClient.get<Member>("/members/me");
  return res.data;
}

/**
 * Thủ thư duyệt cấp thẻ thư viện cho độc giả
 * Backend tự sinh mã số thẻ TV-YYYY-XXXX và cập nhật ngày cấp
 */
export async function issueCard(memberId: string | number): Promise<Member> {
  const res = await apiClient.post<Member>(`/members/${encodePathId(memberId)}/issue-card`, {});
  return res.data;
}

/**
 * Cập nhật trạng thái thẻ (ACTIVE, BLOCKED, ...)
 */
export async function setMemberStatus(
  memberId: string | number,
  status: MemberStatus,
): Promise<Member> {
  const res = await apiClient.patch<Member>(`/members/${encodePathId(memberId)}/status`, { status });
  return res.data;
}

export interface UpdateMemberInput {
  fullName: string;
  phone: string;
  email: string;
  cardNumber?: string | null;
  status?: MemberStatus;
}

export async function updateMember(
  memberId: string | number,
  input: UpdateMemberInput,
): Promise<Member> {
  const res = await apiClient.patch<Member>(`/members/${encodePathId(memberId)}`, input);
  return res.data;
}

export async function deleteMember(memberId: string | number): Promise<void> {
  await apiClient.delete(`/members/${encodePathId(memberId)}`);
}

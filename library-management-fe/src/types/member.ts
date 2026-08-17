// Định nghĩa Enum hỗ trợ cả định dạng Spring Boot (viết hoa) và FE (viết thường)
export type MemberStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED"
  | "pending"
  | "active"
  | "suspended"
  | "blocked";

export interface Member {
  id: number | string;
  userId?: number | string;
  fullName: string;
  phone: string;
  email: string;
  cardNumber: string | null;
  status: MemberStatus;
  issuedDate: string | null;
}

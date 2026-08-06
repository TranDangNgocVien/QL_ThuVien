export type MemberStatus = "pending" | "active" | "suspended";

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  cardNumber: string | null;
  status: MemberStatus;
  issuedDate: string | null;
}

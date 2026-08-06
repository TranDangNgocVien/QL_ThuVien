export type Role = "librarian" | "customer";

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  fullName: string;
  memberId?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

// 1. Hỗ trợ Enum viết hoa từ Spring Boot (kèm fallback chữ thường nếu cần)
export type Role = "librarian" | "customer";

export interface AuthUser {
  id?: number | string;
  username: string;
  role: Role;
  fullName: string;
  memberId?: number | string;
  email?: string;
  phone?: string;
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

// 2. Định nghĩa DTO phản hồi chứa JWT Token thực tế từ Spring Boot
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

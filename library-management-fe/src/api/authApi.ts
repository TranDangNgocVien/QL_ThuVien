import { apiClient } from "./client";
import type { AuthResponse, LoginInput, RegisterInput } from "../types/auth";

/**
 * Dang nhap: POST /auth/login
 * Backend tra ve JWT token va thong tin user.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", {
    login: input.username,
    username: input.username,
    password: input.password,
  });

  return response.data;
}

/**
 * Dang ky tai khoan khach hang: POST /auth/register
 * Backend xu ly tao user va tao member.
 */
export async function registerCustomer(input: RegisterInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", {
    login: input.username,
    username: input.username,
    password: input.password,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
  });

  return response.data;
}

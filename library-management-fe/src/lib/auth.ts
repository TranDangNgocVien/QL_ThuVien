import type { AuthUser, Role } from "../types/auth";

export function normalizeRole(role: unknown): Role {
  return String(role ?? "").toUpperCase() === "LIBRARIAN" ? "librarian" : "customer";
}

export function normalizeAuthUser(raw: unknown): AuthUser {
  const source = (raw ?? {}) as Record<string, any>;
  const user = (source.user ?? source.account ?? source) as Record<string, any>;
  const member = (source.member ?? user.member) as Record<string, any> | undefined;

  return {
    id: user.id ?? user.userId ?? source.userId,
    username: String(user.username ?? user.login ?? source.username ?? source.login ?? ""),
    role: normalizeRole(user.role ?? source.role),
    fullName: String(user.fullName ?? user.name ?? source.fullName ?? source.name ?? ""),
    memberId: user.memberId ?? source.memberId ?? member?.id,
    email: user.email ?? source.email ?? member?.email,
    phone: user.phone ?? source.phone ?? member?.phone,
  };
}

export function getAuthToken(raw: unknown): string | undefined {
  const source = (raw ?? {}) as Record<string, any>;
  return source.token ?? source.accessToken ?? source.jwt ?? source.bearerToken;
}

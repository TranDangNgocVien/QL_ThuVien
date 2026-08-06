import { apiClient } from "./client";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";
import type { Member } from "../types/member";

interface UserRecord {
  id: string;
  username: string;
  password: string;
  role: "librarian" | "customer";
  fullName: string;
  memberId?: string;
}

function toAuthUser(record: UserRecord): AuthUser {
  return {
    id: record.id,
    username: record.username,
    role: record.role,
    fullName: record.fullName,
    memberId: record.memberId,
  };
}

export async function login({ username, password }: LoginInput): Promise<AuthUser> {
  const res = await apiClient.get<UserRecord[]>("/users", {
    params: { username },
  });
  const record = res.data.find((u) => u.password === password);
  if (!record) {
    throw new Error("INVALID_CREDENTIALS");
  }
  return toAuthUser(record);
}

export async function checkUsernameTaken(username: string): Promise<boolean> {
  const res = await apiClient.get<UserRecord[]>("/users", {
    params: { username },
  });
  return res.data.length > 0;
}

// Đăng ký tài khoản khách hàng: tạo user (role=customer) + hồ sơ member trạng thái
// "pending" — khách sẽ cần thủ thư lập thẻ thư viện (cấp cardNumber) mới mượn được sách.
export async function registerCustomer(input: RegisterInput): Promise<AuthUser> {
  const taken = await checkUsernameTaken(input.username);
  if (taken) {
    throw new Error("USERNAME_TAKEN");
  }

  const memberRes = await apiClient.post<Member>("/members", {
    userId: "",
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    cardNumber: null,
    status: "pending",
    issuedDate: null,
  });
  const member = memberRes.data;

  const userRes = await apiClient.post<UserRecord>("/users", {
    username: input.username,
    password: input.password,
    role: "customer",
    fullName: input.fullName,
    memberId: member.id,
  });

  // liên kết ngược memberId <-> userId
  await apiClient.patch(`/members/${member.id}`, { userId: userRes.data.id });

  return toAuthUser(userRes.data);
}

# Cây thư mục dự án — theo từng phần chức năng

Dự án được tổ chức theo kiểu **feature-first trong từng lớp** (types → api → hooks →
components → pages), mỗi phần nghiệp vụ đi xuyên suốt các lớp đó. Dưới đây là cây thư mục
đầy đủ, được chú thích theo từng phần để dễ tra cứu khi báo cáo bài tập.

```
library-management-fe/
│
├── db.json                        # "Backend" giả lập cho json-server
│                                   #   - books   : catalog sách (Phần Quản lý sách)
│                                   #   - users   : tài khoản đăng nhập (Phần Xác thực)
│                                   #   - members : thẻ thư viện (Phần Thẻ thư viện)
│                                   #   - loans   : phiếu mượn/trả (Phần Mượn/Trả)
│
├── index.html                     # Fonts (Plus Jakarta Sans / Inter / JetBrains Mono)
├── package.json                   # Scripts: dev, server, dev:all, build, test
├── tailwind.config.js             # Bảng màu xanh-trắng + gradient công nghệ
├── vite.config.ts                 # Cấu hình Vite + Vitest
├── tsconfig*.json                 # Cấu hình TypeScript
│
└── src/
    │
    ├── main.tsx                   # Entry point: BrowserRouter + QueryClientProvider
    │                               #   + AuthProvider + Toaster (sonner)
    ├── App.tsx                    # Khai báo toàn bộ Route + phân quyền theo vai trò
    ├── i18n.ts                    # Cấu hình react-i18next (vi/en)
    ├── index.css                  # Theme toàn cục: gradient, card, badge, focus-ring
    │
    ├── types/                     # ─── Định nghĩa kiểu dữ liệu (TypeScript) ───
    │   ├── book.ts                 →  Phần Quản lý sách
    │   ├── auth.ts                 →  Phần Xác thực & Phân quyền
    │   ├── member.ts               →  Phần Thẻ thư viện
    │   └── loan.ts                 →  Phần Mượn / Trả (kèm getLoanDisplayStatus)
    │
    ├── api/                       # ─── Gọi REST API (axios → json-server) ───
    │   ├── client.ts               →  axios instance dùng chung
    │   ├── booksApi.ts             →  Phần Quản lý sách (CRUD + fetchAllBooks)
    │   ├── authApi.ts              →  Phần Xác thực (login/register)
    │   ├── membersApi.ts           →  Phần Thẻ thư viện (issueCard, setStatus)
    │   └── loansApi.ts             →  Phần Mượn / Trả (borrow/return)
    │
    ├── context/                   # ─── State toàn cục ───
    │   └── AuthContext.tsx         →  Phần Xác thực & Phân quyền (session, role)
    │
    ├── hooks/                     # ─── Custom hooks (TanStack Query) ───
    │   ├── useBooks.ts             →  Phần Quản lý sách
    │   ├── useMembers.ts           →  Phần Thẻ thư viện
    │   └── useLoans.ts             →  Phần Mượn / Trả
    │
    ├── components/                # ─── Component dùng lại nhiều nơi ───
    │   ├── ui/                     →  Nguyên tử giao diện (kiểu shadcn/ui)
    │   │   ├── button.tsx           —  nút bấm, biến thể gradient xanh
    │   │   ├── input.tsx            —  input / textarea / label / field-error
    │   │   ├── select.tsx           —  dropdown
    │   │   └── dialog.tsx           —  modal + confirm-dialog
    │   ├── AppLayout.tsx           →  Khung layout chung: header gradient + nav
    │   │                              theo vai trò (Phần Xác thực & Phân quyền)
    │   ├── ProtectedRoute.tsx      →  Chặn route theo trạng thái đăng nhập/vai trò
    │   ├── BookForm.tsx            →  Phần Quản lý sách (react-hook-form + zod)
    │   ├── BookTable.tsx           →  Phần Quản lý sách (chế độ staff/customer)
    │   ├── BookFilters.tsx         →  Phần Quản lý sách (tìm kiếm + lọc)
    │   ├── PaginationBar.tsx       →  Phần Quản lý sách (phân trang)
    │   ├── ExportButton.tsx        →  Xuất Excel danh sách sách
    │   └── LanguageSwitcher.tsx    →  Đa ngôn ngữ (variant light/onDark)
    │
    ├── pages/                     # ─── Từng màn hình, gắn với 1 route ───
    │   ├── LoginPage.tsx           →  Phần Xác thực & Phân quyền  (/login)
    │   ├── RegisterPage.tsx        →  Phần Xác thực & Phân quyền  (/register)
    │   ├── StaffBooksPage.tsx      →  Phần Quản lý sách (Nhân viên) (/staff/books)
    │   ├── StaffMembersPage.tsx    →  Phần Thẻ thư viện (Nhân viên) (/staff/members)
    │   ├── StaffLoansPage.tsx      →  Phần Mượn/Trả (Nhân viên)     (/staff/loans)
    │   ├── StaffStatsPage.tsx      →  Phần Thống kê (Nhân viên)     (/staff/stats)
    │   ├── SearchPage.tsx          →  Phần Tìm & Mượn sách (Khách)  (/search)
    │   └── MyLoansPage.tsx         →  Phần Mượn/Trả (Khách)         (/my-loans)
    │
    ├── locales/                    # ─── Đa ngôn ngữ ───
    │   ├── vi.json                  —  Toàn bộ chuỗi Tiếng Việt
    │   └── en.json                  —  Toàn bộ chuỗi English
    │
    ├── lib/
    │   └── utils.ts                →  Hàm cn() gộp className (clsx + tailwind-merge)
    │
    └── test/                       # ─── Unit test (Vitest + Testing Library) ───
        ├── setup.ts                  —  Khởi tạo jest-dom + i18n cho môi trường test
        ├── BookForm.test.tsx         →  Test 1 component (yêu cầu bắt buộc)
        ├── useBooks.test.tsx         →  Test 1 custom hook (yêu cầu bắt buộc)
        └── loanStatus.test.ts        →  Test hàm tính trạng thái quá hạn
```

## Bản đồ "Phần chức năng" ↔ "Route" ↔ "Vai trò"

| Phần chức năng | Route | Vai trò xem được | File màn hình chính |
|---|---|---|---|
| Đăng nhập / Đăng ký | `/login`, `/register` | Chưa đăng nhập | `pages/LoginPage.tsx`, `pages/RegisterPage.tsx` |
| Quản lý sách (CRUD) | `/staff/books` | Nhân viên | `pages/StaffBooksPage.tsx` |
| Tìm & mượn sách | `/search` | Khách hàng | `pages/SearchPage.tsx` |
| Sách của tôi (tự trả) | `/my-loans` | Khách hàng | `pages/MyLoansPage.tsx` |
| Thẻ thư viện | `/staff/members` | Nhân viên | `pages/StaffMembersPage.tsx` |
| Mượn / Trả tại quầy | `/staff/loans` | Nhân viên | `pages/StaffLoansPage.tsx` |
| Thống kê + Xuất Excel | `/staff/stats` | Nhân viên | `pages/StaffStatsPage.tsx` |

## Vì sao tổ chức theo lớp thay vì theo từng phần thành các thư mục riêng?

Dự án dùng cấu trúc **theo lớp kỹ thuật** (`types/ → api/ → hooks/ → components/ → pages/`)
thay vì gom mỗi phần nghiệp vụ vào một thư mục riêng (`features/books/`, `features/loans/`...).
Với quy mô bài tập thực hành hiện tại (dưới 30 file nghiệp vụ), cách tổ chức này giúp:

- Dễ so sánh các file cùng vai trò (toàn bộ API ở một chỗ, toàn bộ hook ở một chỗ).
- Đúng với cách trình bày trong Kế hoạch đào tạo (JS/TS → React & Hooks → TanStack Query →
  UI → Routing & Forms), mỗi thư mục tương ứng một "Phần" trong chương trình học.

Nếu dự án phát triển lớn hơn, bước tiếp theo tự nhiên là refactor sang cấu trúc
`features/<tên-phần>/{api,hooks,components}` — cấu trúc hiện tại đã tách rõ ranh giới theo
phần (nhờ tên file gắn với nghiệp vụ) nên việc refactor này sẽ khá cơ học.

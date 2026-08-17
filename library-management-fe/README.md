# Thư Viện Số — Bài tập thực hành Frontend

Bài tập thực hành "Quản lý Thư viện" theo Kế hoạch đào tạo Frontend, có phân quyền
**Độc giả** và **Nhân viên (Thủ thư)**.

## Công nghệ sử dụng

| Hạng mục | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Định tuyến & phân quyền | react-router-dom (v7) + `ProtectedRoute` theo vai trò |
| Quản lý state server | TanStack Query (`useQuery`, `useMutation`) |
| Form & validate | react-hook-form + zod (kèm Dynamic Field Array cho "Từ khoá") |
| Giao diện | Tailwind CSS + component tự dựng theo phong cách shadcn/ui |
| API | REST API giả lập bằng `json-server` (đọc từ `db.json`) |
| Thông báo | sonner (Toast) |
| Đa ngôn ngữ | react-i18next (Tiếng Việt / English) |
| Unit test | Vitest + React Testing Library |
| Xuất dữ liệu | xlsx (SheetJS) — xuất danh sách sách & báo cáo thống kê ra Excel |

## Phân quyền hệ thống

### Độc giả (`role: customer`)
- Đăng ký tài khoản (`/register`) — sau khi đăng ký, thẻ thư viện ở trạng thái
  **"Chờ lập thẻ"** cho tới khi thủ thư duyệt.
- Tìm kiếm sách (`/search`), tự mượn sách trực tiếp nếu thẻ đang **"Đang hoạt động"**.
- Xem "Sách của tôi" (`/my-loans`) — theo dõi hạn trả, tự xác nhận trả sách.

### Nhân viên / Thủ thư (`role: librarian`)
- **Quản lý sách** (`/staff/books`): CRUD đầy đủ (thêm/sửa/xoá đầu sách) — chỉ vai trò này có quyền.
- **Thẻ thư viện** (`/staff/members`): lập thẻ cho độc giả mới đăng ký, tạm khoá/kích hoạt lại thẻ.
- **Phiếu mượn** (`/staff/loans`): lập phiếu mượn tại quầy cho bất kỳ độc giả có thẻ active,
  xác nhận trả sách cho mọi phiếu mượn.
- **Thống kê** (`/staff/stats`): tổng quan tình trạng sách (tổng đầu sách, tổng bản, đang mượn,
  quá hạn), thống kê theo thể loại, top sách mượn nhiều nhất, xuất báo cáo Excel.

## Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Thủ thư | `thuthu` | `123456` | Toàn quyền quản trị |
| Độc giả (đã có thẻ) | `khach1` | `123456` | Thẻ `TV-2026-0001`, đang mượn 2 cuốn (1 cuốn quá hạn) |
| Độc giả (chưa có thẻ) | `khach2` | `123456` | Thử luồng "chờ thủ thư lập thẻ" |

> Đây là hệ thống đăng nhập giả lập cho mục đích học tập — mật khẩu lưu dạng plain-text
> trong `db.json`, **không dùng cách này cho sản phẩm thật**.

## Cài đặt

```bash
npm install
```

## Chạy dự án (cần chạy song song API giả lập + Vite dev server)

```bash
npm run dev:all
```

Hoặc chạy riêng 2 terminal:

```bash
# Terminal 1: API giả lập (json-server), cổng 3001
npm run server

# Terminal 2: Vite dev server, cổng 5173
npm run dev
```

Mở trình duyệt tại địa chỉ Vite in ra (thường là `http://localhost:5173`), hệ thống sẽ
chuyển đến trang đăng nhập trước tiên.

> Lưu ý: Nếu chỉ chạy `npm run dev` mà quên chạy `npm run server`, các trang sẽ báo lỗi
> "Không thể tải dữ liệu" vì chưa có API để gọi.

## Chạy Unit Test

```bash
npm run test
```

## Build production

```bash
npm run build
```

## Cấu trúc thư mục chính

> Xem cây thư mục đầy đủ, chú thích theo từng phần chức năng tại **[STRUCTURE.md](./STRUCTURE.md)**.

```
src/
  api/             # axios client + hàm gọi REST API (books, auth, members, loans)
  context/         # AuthContext — quản lý phiên đăng nhập (lưu localStorage)
  hooks/           # useBooks, useLoans, useMembers (TanStack Query)
  components/      # BookForm, BookTable, AppLayout, ProtectedRoute, ...
  components/ui/   # Button, Input, Select, Dialog (component dùng chung kiểu shadcn/ui)
  pages/           # LoginPage, RegisterPage, SearchPage, MyLoansPage,
                    # StaffBooksPage, StaffMembersPage, StaffLoansPage, StaffStatsPage
  locales/         # vi.json, en.json — bản dịch i18next
  test/            # BookForm.test.tsx, useBooks.test.tsx, loanStatus.test.ts
db.json            # dữ liệu mẫu: books, users (tài khoản), members (thẻ thư viện), loans
```

## Luồng nghiệp vụ chính

1. Độc giả đăng ký tài khoản → hệ thống tạo hồ sơ `member` trạng thái **"Chờ lập thẻ"**.
2. Thủ thư vào **Thẻ thư viện**, bấm **"Lập thẻ"** → sinh số thẻ, chuyển trạng thái **"Đang hoạt động"**.
3. Độc giả đăng nhập lại, vào **Tìm sách**, bấm **"Mượn sách"** → hệ thống trừ `available`,
   tạo phiếu mượn với hạn trả = ngày mượn + 14 ngày.
4. Độc giả tự trả sách ở **"Sách của tôi"**, hoặc thủ thư xác nhận trả tại quầy ở **Phiếu mượn**
   → hệ thống cộng lại `available` và đóng phiếu mượn.
5. Trạng thái **"Quá hạn"** được tính động (so `dueDate` với thời điểm hiện tại), không cần
   tác vụ nền cập nhật.
6. Thủ thư xem **Thống kê** để theo dõi tình trạng kho sách và xuất báo cáo Excel bất kỳ lúc nào.

## Ghi chú mở rộng

- API giả lập dùng `json-server`, có thể thay bằng API thật bằng cách đổi `baseURL` trong
  `src/api/client.ts`.
- Có thể mở rộng thêm: upload ảnh bìa sách, thông báo email/SMS khi sách quá hạn, gia hạn mượn sách.

## Dữ liệu SQL/API cần có cho chức năng phiếu mượn

Frontend không tự thêm dữ liệu giả. Backend/API cần có dữ liệu thật trong SQL và trả đúng cấu trúc cho các endpoint sau:

### Bảng `users`

Các cột tối thiểu: `id`, `username`, `password`, `role`, `full_name`, `email`, `phone`.

- `role` cần hỗ trợ `librarian` và `customer`.
- API đăng ký/tạo độc giả nhận `username`, `password`, `fullName`, `email`, `phone`.

### Bảng `members`

Các cột tối thiểu: `id`, `user_id`, `full_name`, `phone`, `email`, `card_number`, `status`, `issued_date`.

- `status` cần hỗ trợ `PENDING`, `ACTIVE`, `SUSPENDED`, `BLOCKED`.
- Độc giả chỉ được lập phiếu mượn khi thẻ `ACTIVE`.
- Thủ thư cần API sửa/xóa thông tin độc giả.

### Bảng `books`

Các cột tối thiểu: `id`, `title`, `author`, `category`, `published_year`, `quantity`, `available`, `isbn`, `description`, `image_url`.

- `available` phải giảm khi duyệt/lập phiếu mượn và tăng lại khi xác nhận trả.

### Bảng `loans`

Các cột tối thiểu: `id`, `code`, `member_id`, `borrow_date`, `due_date`, `return_date`, `late_fee`, `status`, `created_at`.

- `status` cần hỗ trợ `PENDING_BORROW`, `BORROWING`, `RETURN_PENDING`, `RETURNED`, `REJECTED`.
- `borrow_date` và `due_date` lấy từ form lập phiếu, không tự cố định trên frontend.
- `borrow_date` phải là ngày hiện tại hoặc ngày trong tương lai.

### Bảng `loan_items`

Các cột tối thiểu: `id`, `loan_id`, `book_id`, `quantity`.

- Một phiếu mượn tối đa 3 sách.
- API trả chi tiết phiếu nên include `items` dạng:

```json
[
  {
    "id": 1,
    "loanId": 10,
    "bookId": 5,
    "bookTitle": "Tên sách",
    "quantity": 1
  }
]
```

### Endpoint frontend đang sử dụng

- `POST /auth/register`: tạo tài khoản độc giả.
- `GET /members`, `GET /members/me`, `PATCH /members/{id}`, `DELETE /members/{id}`, `POST /members/{id}/issue-card`, `PATCH /members/{id}/status`.
- `GET /books`, `GET /loans`, `GET /loans/my-loans`.
- `POST /loans/borrow-slip`: độc giả lập phiếu từ giỏ sách, backend tự lấy `memberId` từ JWT.
- `POST /loans/staff-borrow-slip`: thủ thư lập phiếu cho độc giả, body có `memberId`, `borrowDate`, `dueDate`, `items`.
- `POST /loans/{id}/approve`, `POST /loans/{id}/reject`, `POST /loans/{id}/return`, `POST /loans/{id}/confirm-return`.

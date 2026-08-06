import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StaffBooksPage from "./pages/StaffBooksPage";
import StaffMembersPage from "./pages/StaffMembersPage";
import StaffLoansPage from "./pages/StaffLoansPage";
import StaffStatsPage from "./pages/StaffStatsPage";
import SearchPage from "./pages/SearchPage";
import MyLoansPage from "./pages/MyLoansPage";

// Sau khi đăng nhập, điều hướng theo vai trò: thủ thư -> quản lý sách,
// khách hàng -> trang tìm sách.
function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/search" replace />;
  return (
    <Navigate to={user.role === "librarian" ? "/staff/books" : "/search"} replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route path="/search" element={<SearchPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["librarian"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/staff/books" element={<StaffBooksPage />} />
          <Route path="/staff/members" element={<StaffMembersPage />} />
          <Route path="/staff/loans" element={<StaffLoansPage />} />
          <Route path="/staff/stats" element={<StaffStatsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/my-loans" element={<MyLoansPage />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRoute />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

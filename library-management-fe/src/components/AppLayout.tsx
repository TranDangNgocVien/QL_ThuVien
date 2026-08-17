import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookMarked, LogIn, LogOut, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "../lib/utils";
import { ConfirmDialog } from "./ui/dialog";

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const staffLinks = [
    { to: "/staff/books", label: t("nav.books") },
    { to: "/staff/members", label: t("nav.members") },
    { to: "/staff/loans", label: t("nav.loans") },
    { to: "/staff/stats", label: t("nav.stats") },
  ];

  const customerLinks = [
    { to: "/search", label: t("nav.search") },
    { to: "/cart", label: t("nav.cart") },
    { to: "/my-loans", label: t("nav.myLoans") },
  ];

  const links = user?.role === "librarian" ? staffLinks : customerLinks;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-header-gradient text-white shadow-glow">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                <BookMarked size={20} className="text-cyan-300" />
              </span>
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight">
                  {t("app.title")}
                </h1>
                <p className="text-xs text-white/70">{t("app.subtitle")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="onDark" />
              {user && (
                <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-medium">{user.fullName}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-cyan-300">
                      {user.role === "librarian" ? t("auth.roleStaff") : t("auth.roleCustomer")}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmLogoutOpen(true)}
                    aria-label={t("auth.logout")}
                    className="focus-ring rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
              {!user && (
                <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                  <Link
                    to="/login"
                    className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <LogIn size={15} />
                    {t("auth.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/20"
                  >
                    <UserPlus size={15} />
                    {t("auth.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {user && (
            <nav className="flex gap-1 overflow-x-auto">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "focus-ring whitespace-nowrap rounded-xl px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors",
                      isActive
                        ? "bg-white/20 text-white shadow-inner backdrop-blur-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title={t("auth.logoutConfirmTitle")}
        body={t("auth.logoutConfirmBody")}
        confirmLabel={t("auth.logout")}
        cancelLabel={t("confirm.cancel")}
        onConfirm={() => {
          setConfirmLogoutOpen(false);
          logout();
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </div>
  );
}

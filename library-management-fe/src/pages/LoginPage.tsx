import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookMarked, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Input, Label, FieldError } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return (
      <Navigate to={user.role === "librarian" ? "/staff/books" : "/search"} replace />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ username, password });
      navigate(result.role === "librarian" ? "/staff/books" : "/search", {
        replace: true,
      });
    } catch {
      setError(t("auth.invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-gradient px-4">
      {/* Vệt sáng trang trí phía sau — cảm giác công nghệ, không ảnh hưởng nội dung */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
              <BookMarked size={18} className="text-cyan-300" />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              {t("app.title")}
            </span>
          </div>
          <LanguageSwitcher variant="onDark" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 className="font-display text-xl font-semibold text-stacks-dark">
            {t("auth.loginTitle")}
          </h2>

          <div>
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-stacks-dark">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-5 w-5 rounded border-paper-line accent-stacks"
            />
            {t("auth.showPassword")}
          </label>

          <FieldError>{error ?? undefined}</FieldError>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
          </Button>

          <p className="text-center text-xs text-ink/60">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-medium text-stacks underline">
              {t("auth.registerNow")}
            </Link>
          </p>

        </form>

        <button
          type="button"
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          onClick={() => navigate("/")}
        >
          <Home size={14} />
          {t("auth.backHome")}
        </button>
      </div>
    </div>
  );
}

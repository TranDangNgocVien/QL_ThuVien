import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Input, Label, FieldError } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

function buildSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().min(1, t("auth.errors.fullNameRequired")),
    phone: z.string().min(8, t("auth.errors.phoneInvalid")),
    email: z.string().email(t("auth.errors.emailInvalid")),
    username: z.string().min(3, t("auth.errors.usernameMin")),
    password: z.string().min(4, t("auth.errors.passwordMin")),
  });
}

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const { user, register: registerCustomer } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = buildSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) {
    return (
      <Navigate to={user.role === "librarian" ? "/staff/books" : "/search"} replace />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerCustomer(values);
      navigate("/search", { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message === "USERNAME_TAKEN") {
        setServerError(t("auth.errors.usernameTaken"));
      } else {
        setServerError(t("auth.errors.registerFailed"));
      }
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-gradient px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher variant="onDark" />
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-stacks-dark">
              {t("auth.registerTitle")}
            </h2>
            <p className="mt-1 text-xs text-ink/60">{t("auth.registerHint")}</p>
          </div>

          <div>
            <Label htmlFor="fullName">{t("auth.fullName")}</Label>
            <Input id="fullName" {...register("fullName")} autoFocus />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" {...register("phone")} />
            <FieldError>{errors.phone?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input id="username" {...register("username")} />
            <FieldError>{errors.username?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <FieldError>{serverError ?? undefined}</FieldError>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("auth.registering") : t("auth.register")}
          </Button>

          <p className="text-center text-xs text-ink/60">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="font-medium text-stacks underline">
              {t("auth.login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

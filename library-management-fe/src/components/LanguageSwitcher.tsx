import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";

interface LanguageSwitcherProps {
  /** "light": nền sáng, chữ xanh (mặc định). "onDark": dùng trên nền gradient/tối. */
  variant?: "light" | "onDark";
}

export function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const langs: { code: "vi" | "en"; label: string }[] = [
    { code: "vi", label: "VI" },
    { code: "en", label: "EN" },
  ];

  const isDark = variant === "onDark";

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-xl border",
        isDark ? "border-white/30" : "border-stacks/30",
      )}
    >
      {langs.map((lang) => {
        const active = i18n.language.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={cn(
              "focus-ring px-2.5 py-1 font-mono text-xs tracking-wide transition-colors",
              isDark
                ? active
                  ? "bg-white/20 text-white"
                  : "bg-transparent text-white/70 hover:bg-white/10"
                : active
                  ? "bg-stacks text-white"
                  : "bg-transparent text-stacks hover:bg-stacks/10",
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nền trắng / xanh rất nhạt cho toàn bộ giao diện
        paper: "#F6F9FF",
        "paper-line": "#DCE7F7",
        ink: "#0F172A",
        // Xanh dương thương hiệu chính
        stacks: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1E3A8A",
        },
        // Xanh cyan làm điểm nhấn công nghệ
        brass: {
          DEFAULT: "#0891B2",
          light: "#22D3EE",
        },
        rust: "#DC2626",
        moss: "#059669",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #06B6D4 100%)",
        "header-gradient":
          "linear-gradient(90deg, #1E3A8A 0%, #2563EB 60%, #0891B2 100%)",
        "card-lines":
          "repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(37,99,235,0.05) 12px, rgba(37,99,235,0.05) 13px)",
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(37, 99, 235, 0.35)",
      },
    },
  },
  plugins: [],
};

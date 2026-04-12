import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#EA580C",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#EA580C",
          foreground: "#FFFFFF",
          hover: "#C2410C",
          active: "#9A3412",
        },
        secondary: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
          primary: "#EA580C",
          "primary-foreground": "#FFFFFF",
          accent: "#F1F5F9",
          "accent-foreground": "#0F172A",
          border: "#E5E7EB",
          ring: "#EA580C",
        },
        violet: "#8B5CF6",
        teal: "#14B8A6",
        rose: "#F43F5E",
        amber: "#F59E0B",
        indigo: "#EA580C",
        emerald: "#10B981",
        cyan: "#06B6D4",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

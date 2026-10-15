/** @type {import('tailwindcss').Config} */
// All brand colors live as RGB channels in src/index.css (:root --c-*).
// Change them in ONE place and the whole system follows.
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      colors: {
        // Text
        primary:   "#111827",
        secondary: "#6B7280",
        muted:     "#9CA3AF",
        "text-primary":   "#111827",
        "text-secondary": "#6B7280",
        "text-muted":     "#9CA3AF",

        // Brand
        night: { DEFAULT: c("night"), deep: c("night-deep"), soft: c("night-soft") },
        royal: { DEFAULT: c("royal"), light: c("royal-light"), dark: c("royal-dark") },
        gold:  { DEFAULT: c("gold"),  light: c("gold-light"),  ink: c("gold-ink") },
        flame: c("flame"),
        sand:  c("sand"),
        sandline: c("sandline"),

        // Themeable semantic surfaces
        page:     c("page"),
        card:     c("card"),
        hairline: c("hairline"),

        // Semantic
        success: "#2F6D4F",
        danger:  "#C1502E",
        warning: "#B45309",
        info:    c("royal"),
      },
      borderRadius: {
        "xs": "6px", "sm": "8px", DEFAULT: "10px",
        "md": "12px", "lg": "14px", "xl": "18px",
        "2xl": "22px", "3xl": "28px",
      },
      boxShadow: {
        "xs":    "0 1px 2px 0 rgb(1 25 87 / 0.05)",
        "sm":    "0 1px 3px 0 rgb(1 25 87 / 0.08), 0 1px 2px -1px rgb(1 25 87 / 0.06)",
        DEFAULT: "0 4px 12px -2px rgb(1 25 87 / 0.08), 0 2px 6px -2px rgb(1 25 87 / 0.05)",
        "md":    "0 8px 20px -4px rgb(1 25 87 / 0.10), 0 3px 8px -3px rgb(1 25 87 / 0.06)",
        "lg":    "0 16px 36px -8px rgb(1 25 87 / 0.14), 0 6px 14px -6px rgb(1 25 87 / 0.08)",
        "xl":    "0 24px 56px -12px rgb(1 25 87 / 0.20), 0 10px 22px -8px rgb(1 25 87 / 0.10)",
        "glow-gold":  "0 0 0 4px rgb(254 164 6 / 0.18)",
        "glow-royal": "0 0 0 4px rgb(0 98 253 / 0.16)",
      },
      keyframes: {
        float:            { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        "float-slow":     { "0%,100%": { transform: "translateY(0) translateX(0)" }, "33%": { transform: "translateY(-12px) translateX(8px)" }, "66%": { transform: "translateY(8px) translateX(-8px)" } },
        aurora:           { "0%,100%": { transform: "translate(0,0) scale(1)" }, "25%": { transform: "translate(24px,-16px) scale(1.06)" }, "50%": { transform: "translate(-16px,20px) scale(0.96)" }, "75%": { transform: "translate(-24px,-12px) scale(1.03)" } },
        shimmer:          { "0%": { backgroundPosition: "-200% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        "fade-in-up":     { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in":        { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in":       { "0%": { opacity: "0", transform: "scale(0.94)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "slide-in-right": { "0%": { opacity: "0", transform: "translateX(16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "slide-in-left":  { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "glow-pulse":     { "0%,100%": { boxShadow: "0 0 0 0 rgb(254 164 6 / 0.35)" }, "50%": { boxShadow: "0 0 0 12px rgb(254 164 6 / 0)" } },
        "bounce-subtle":  { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(5px)" } },
        "spin-slow":      { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "float":          "float 6s ease-in-out infinite",
        "float-slow":     "float-slow 12s ease-in-out infinite",
        "aurora":         "aurora 22s ease-in-out infinite",
        "shimmer":        "shimmer 2.6s linear infinite",
        "fade-in-up":     "fade-in-up 0.65s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":        "fade-in 0.4s ease-out both",
        "scale-in":       "scale-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-left":  "slide-in-left 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse":     "glow-pulse 2.8s ease-in-out infinite",
        "bounce-subtle":  "bounce-subtle 2.4s ease-in-out infinite",
        "spin-slow":      "spin-slow 1.4s linear infinite",
      },
      fontSize: {
        "display":   ["clamp(2rem, 5vw, 3.75rem)",  { lineHeight: "1.05", letterSpacing: "-0.028em", fontWeight: "700" }],
        "headline":  ["clamp(1.5rem, 3vw, 2.25rem)",{ lineHeight: "1.15", letterSpacing: "-0.02em",  fontWeight: "700" }],
        "title":     ["1.5rem",   { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        "section":   ["1.25rem",  { lineHeight: "1.3",  letterSpacing: "-0.01em"  }],
        "body":      ["1rem",     { lineHeight: "1.55" }],
        "body-sm":   ["0.875rem", { lineHeight: "1.5"  }],
        "btn":       ["0.9375rem",{ lineHeight: "1.4"  }],
        "price":     ["1.125rem", { lineHeight: "1.3", fontWeight: "700" }],
        "price-lg":  ["1.375rem", { lineHeight: "1.3", fontWeight: "700" }],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

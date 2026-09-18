/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      colors: {
        // Text
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "text-muted": "#9CA3AF",

        // Brand (existing)
        night: "#101A2E",
        sand: "#F5F3EC",
        gold: "#E8A33D",
        green: "#2F6D4F",
        rust: "#C1502E",
        sandline: "#E6E2D6",
      },
      fontSize: {
        // Typography scale
        "body": ["1rem", { lineHeight: "1.55" }],       // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5" }], // 14px
        "btn": ["0.9375rem", { lineHeight: "1.4" }],    // 15px
        "price": ["1.125rem", { lineHeight: "1.3", fontWeight: "700" }],  // 18px
        "price-lg": ["1.375rem", { lineHeight: "1.3", fontWeight: "700" }], // 22px
      },
    },
  },
  plugins: [],
};
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#101A2E",
        "night-2": "#182541",
        sand: "#F5F3EC",
        gold: "#E8A33D",
        "gold-dark": "#B87A1F",
        market: "#2F6D4F",
        "market-dark": "#1F4B36",
        rust: "#C1502E",
        ink: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.4" }],
        "2xl": ["24px", { lineHeight: "1.4" }],
        "3xl": ["30px", { lineHeight: "1.4" }],
        "4xl": ["32px", { lineHeight: "1.4" }],
      },
    },
  },
  plugins: [],
};

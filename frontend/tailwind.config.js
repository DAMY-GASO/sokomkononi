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
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

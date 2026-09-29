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
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-20px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "33%":      { transform: "translateY(-16px) translateX(12px)" },
          "66%":      { transform: "translateY(10px) translateX(-12px)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "25%":      { transform: "translate(30px, -20px) scale(1.08)" },
          "50%":      { transform: "translate(-20px, 25px) scale(0.94)" },
          "75%":      { transform: "translate(-30px, -15px) scale(1.04)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,163,61,0.4)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(232,163,61,0)" },
        },
      },
      animation: {
        "float":          "float 6s ease-in-out infinite",
        "float-slow":     "float-slow 12s ease-in-out infinite",
        "aurora":         "aurora 18s ease-in-out infinite",
        "shimmer":        "shimmer 3s linear infinite",
        "fade-in-up":     "fade-in-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "bounce-subtle":  "bounce-subtle 2.4s ease-in-out infinite",
        "glow-pulse":     "glow-pulse 2.6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-20px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "33%":      { transform: "translateY(-16px) translateX(12px)" },
          "66%":      { transform: "translateY(10px) translateX(-12px)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "25%":      { transform: "translate(30px,-20px) scale(1.08)" },
          "50%":      { transform: "translate(-20px,25px) scale(0.94)" },
          "75%":      { transform: "translate(-30px,-15px) scale(1.04)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-soft": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,163,61,0.4)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(232,163,61,0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blink: {
          "0%, 49%":   { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "drift-grow": {
          "0%":   { transform: "translate(0,0) scale(0.8)",       opacity: "0" },
          "15%":  { opacity: "1" },
          "50%":  { transform: "translate(60px,-40px) scale(1.2)", opacity: "1" },
          "85%":  { opacity: "1" },
          "100%": { transform: "translate(140px,-90px) scale(0.85)", opacity: "0" },
        },
        "drift-across": {
          "0%":   { transform: "translate3d(-8vw, 0, 0) scale(1)",       opacity: "0" },
          "8%":   { opacity: "1" },
          "92%":  { opacity: "1" },
          "100%": { transform: "translate3d(108vw, -60px, 0) scale(1.1)", opacity: "0" },
        },
        "beam": {
          "0%":   { transform: "translateX(-120%) skewX(-14deg)", opacity: "0" },
          "12%":  { opacity: "1" },
          "88%":  { opacity: "1" },
          "100%": { transform: "translateX(220%) skewX(-14deg)",  opacity: "0" },
        },
        "glow-breathe": {
          "0%, 100%": { opacity: "0.15" },
          "50%":      { opacity: "0.4" },
        },
        "slide-fade-x": {
          "0%":   { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "float":          "float 6s ease-in-out infinite",
        "float-slow":     "float-slow 12s ease-in-out infinite",
        "aurora":         "aurora 18s ease-in-out infinite",
        "shimmer":        "shimmer 3s linear infinite",
        "fade-in-up":     "fade-in-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in-soft":   "fade-in-soft 1.2s ease-out both",
        "fade-in-soft-delayed": "fade-in-soft 2.5s ease-out 4s both",
        "bounce-subtle":  "bounce-subtle 2.4s ease-in-out infinite",
        "glow-pulse":     "glow-pulse 2.6s ease-in-out infinite",
        "scale-in":       "scale-in 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "drift-grow":     "drift-grow 26s ease-in-out infinite",
        "blink":          "blink 1s step-end infinite",
        "drift-across":   "drift-across 34s linear infinite",
        "beam":           "beam 20s ease-in-out infinite",
        "glow-breathe":   "glow-breathe 9s ease-in-out infinite",
        "slide-fade-x":   "slide-fade-x 0.6s cubic-bezier(0.16,1,0.3,1) both",
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
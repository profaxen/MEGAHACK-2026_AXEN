import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./client/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        card: "var(--bg-card)",
        elevated: "var(--bg-elevated)",
        "accent-green": "var(--accent-green)",
        "accent-amber": "var(--accent-amber)",
        "accent-red": "var(--accent-red)",
        "accent-blue": "var(--accent-blue)",
        "accent-purple": "var(--accent-purple)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        level1: "0 1px 3px rgba(0,0,0,0.4)",
        level2: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)",
        level3: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px var(--border-default)",
        "glow-green": "0 0 24px rgba(0,255,136,0.25), 0 0 48px rgba(0,255,136,0.1)",
        "glow-red": "0 0 24px rgba(239,68,68,0.3), 0 0 48px rgba(239,68,68,0.1)",
        "glow-amber": "0 0 24px rgba(245,158,11,0.25)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;

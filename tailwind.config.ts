import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./client/**/*.{ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px"
      },
      colors: {
        "wb-bg-base": "var(--bg-base)",
        "wb-bg-surface": "var(--bg-surface)",
        "wb-bg-card": "var(--bg-card)",
        "wb-bg-elevated": "var(--bg-elevated)",
        "wb-accent-green": "var(--accent-green)",
        "wb-accent-amber": "var(--accent-amber)",
        "wb-accent-red": "var(--accent-red)",
        "wb-accent-blue": "var(--accent-blue)",
        "wb-accent-purple": "var(--accent-purple)",
        "wb-text-primary": "var(--text-primary)",
        "wb-text-secondary": "var(--text-secondary)",
        "wb-text-muted": "var(--text-muted)"
      },
      boxShadow: {
        "wb-level-1": "0 1px 3px rgba(0,0,0,0.4)",
        "wb-level-2":
          "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        "wb-level-3":
          "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
        "wb-glow-green":
          "0 0 24px rgba(0,255,136,0.25), 0 0 48px rgba(0,255,136,0.1)",
        "wb-glow-red":
          "0 0 24px rgba(239,68,68,0.3), 0 0 48px rgba(239,68,68,0.1)",
        "wb-glow-amber":
          "0 0 24px rgba(245,158,11,0.25), 0 0 48px rgba(245,158,11,0.1)"
      },
      borderRadius: {
        xl: "16px"
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" }
        },
        "satellite-orbit": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "stat-count": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "skeleton-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "satellite-orbit": "satellite-orbit 8s linear infinite",
        "stat-count": "stat-count 0.6s ease-out both",
        "skeleton-shimmer": "skeleton-shimmer 1.5s infinite"
      }
    }
  },
  plugins: []
};

export default config;


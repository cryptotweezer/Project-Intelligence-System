import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── The Obsidian Lens Palette ──────────────────────
        obsidian: "#000000",
        "electric-blue": "#3b82f6",
        "royal-purple": "#d1bcff",
        "ruby-red": "#ffb2be",

        // ── Surface Hierarchy (OLED to bright) ────────────
        surface: {
          lowest: "#0e0e0e",
          low: "#1b1b1b",
          DEFAULT: "#131313",
          container: "#1f1f1f",
          "container-high": "#2a2a2a",
          "container-highest": "#353535",
          bright: "#393939",
          variant: "#353535",
        },

        // ── Semantic ──────────────────────────────────────
        outline: "#8b91a0",
        "outline-variant": "#414754",

        // ── Primary/Secondary/Tertiary ────────────────────
        primary: {
          DEFAULT: "#3b82f6",
          container: "#448fff",
          fixed: "#d7e2ff",
        },
        secondary: {
          DEFAULT: "#d1bcff",
          container: "#7000ff",
        },
        tertiary: {
          DEFAULT: "#ffb2be",
          container: "#ff4d7e",
        },
      },

      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
      },

      letterSpacing: {
        elite: "0.1em",
        command: "-0.02em",
      },

      backgroundImage: {
        "glow-blue":
          "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
        "glow-purple":
          "radial-gradient(ellipse at center, rgba(209,188,255,0.15) 0%, transparent 70%)",
        "glow-red":
          "radial-gradient(ellipse at center, rgba(255,178,190,0.15) 0%, transparent 70%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(53,53,53,0.05) 0%, transparent 100%)",
      },

      boxShadow: {
        "glow-blue": "0 0 20px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)",
        "glow-purple": "0 0 20px rgba(209,188,255,0.3), 0 0 60px rgba(209,188,255,0.1)",
        "glow-red": "0 0 20px rgba(255,178,190,0.3), 0 0 60px rgba(255,178,190,0.1)",
        void: "0 0 60px rgba(0,0,0,0.4)",
      },

      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 8px rgba(255,178,190,0.6)" },
          "50%": { opacity: "0.6", boxShadow: "0 0 20px rgba(255,178,190,0.9)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },

      animation: {
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
        shimmer: "shimmer 3s linear infinite",
      },

      backdropBlur: {
        glass: "12px",
        "glass-lg": "20px",
      },

      borderWidth: {
        hairline: "1px",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                mono: ["var(--font-jetbrains)", "monospace"],
                display: ["var(--font-cal)", "var(--font-inter)", "sans-serif"],
            },
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                    cyan: "#00d4ff",
                    purple: "#8b5cf6",
                    blue: "#3b82f6",
                    green: "#10b981",
                },
                glass: {
                    DEFAULT: "rgba(255,255,255,0.05)",
                    border: "rgba(255,255,255,0.1)",
                    hover: "rgba(255,255,255,0.08)",
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-aurora": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "gradient-cyber": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
                "gradient-glow": "linear-gradient(90deg, #00d4ff, #8b5cf6, #00d4ff)",
            },
            animation: {
                "fade-up": "fadeUp 0.6s ease forwards",
                "fade-in": "fadeIn 0.4s ease forwards",
                "glow-pulse": "glowPulse 2s ease-in-out infinite",
                "float": "float 6s ease-in-out infinite",
                "shimmer": "shimmer 2s linear infinite",
                "border-glow": "borderGlow 3s ease-in-out infinite",
                "text-shimmer": "textShimmer 3s ease-in-out infinite",
                "particle-drift": "particleDrift 8s linear infinite",
                "scan-line": "scanLine 4s linear infinite",
                "pulse-glow": "pulseGlow 2s ease-in-out infinite",
            },
            keyframes: {
                fadeUp: {
                    "0%": { opacity: "0", transform: "translateY(30px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                glowPulse: {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(0, 212, 255, 0.2)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                borderGlow: {
                    "0%, 100%": { borderColor: "rgba(0, 212, 255, 0.3)" },
                    "50%": { borderColor: "rgba(139, 92, 246, 0.6)" },
                },
                textShimmer: {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                },
                particleDrift: {
                    "0%": { transform: "translateY(100vh) rotate(0deg)", opacity: "0" },
                    "10%": { opacity: "1" },
                    "90%": { opacity: "1" },
                    "100%": { transform: "translateY(-100vh) rotate(720deg)", opacity: "0" },
                },
                scanLine: {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(100vh)" },
                },
                pulseGlow: {
                    "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
                    "50%": { opacity: "0.8", transform: "scale(1.05)" },
                },
            },
            boxShadow: {
                "glow-cyan": "0 0 20px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1)",
                "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)",
                "glow-blue": "0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)",
                "glass": "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                "glass-hover": "0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                "card-premium": "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            },
            backdropBlur: {
                xs: "2px",
            },
            screens: {
                xs: "475px",
            },
        },
    },
    plugins: [],
};

export default config;

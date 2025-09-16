/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ✨ Astral Notes Cosmic Colors ✨
        stellar: {
          primary: "hsl(var(--stellar-primary))",
          DEFAULT: "hsl(var(--stellar-primary))",
        },
        cosmic: {
          secondary: "hsl(var(--cosmic-secondary))",
          DEFAULT: "hsl(var(--cosmic-secondary))",
        },
        astral: {
          accent: "hsl(var(--astral-accent))",
          DEFAULT: "hsl(var(--astral-accent))",
        },
        supernova: {
          danger: "hsl(var(--supernova-danger))",
          DEFAULT: "hsl(var(--supernova-danger))",
        },
        aurora: {
          success: "hsl(var(--aurora-success))",
          DEFAULT: "hsl(var(--aurora-success))",
        },
        solar: {
          warning: "hsl(var(--solar-warning))",
          DEFAULT: "hsl(var(--solar-warning))",
        },
        void: {
          black: "hsl(var(--void-black))",
          DEFAULT: "hsl(var(--void-black))",
        },
        space: {
          gray: "hsl(var(--space-gray))",
          DEFAULT: "hsl(var(--space-gray))",
        },
        'cosmic-mist': "hsl(var(--cosmic-mist))",
        'stellar-white': "hsl(var(--stellar-white))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-from-top": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // ✨ Astral Notes Cosmic Animations ✨
        "stellar-pulse": {
          "0%, 100%": { 
            opacity: "0.8", 
            transform: "scale(1)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)"
          },
          "50%": { 
            opacity: "1", 
            transform: "scale(1.05)",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.5)"
          },
        },
        "cosmic-float": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-10px) rotate(1deg)" },
          "50%": { transform: "translateY(-5px) rotate(0deg)" },
          "75%": { transform: "translateY(-15px) rotate(-1deg)" },
        },
        "stardust-shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "galaxy-rotation": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "nebula-breath": {
          "0%, 100%": { 
            filter: "brightness(1) blur(0px)",
            transform: "scale(1)"
          },
          "50%": { 
            filter: "brightness(1.2) blur(2px)",
            transform: "scale(1.02)"
          },
        },
        "cosmic-twinkle": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        // ✨ Astral Notes Cosmic Animations ✨
        "stellar-pulse": "stellar-pulse 3s ease-in-out infinite",
        "cosmic-float": "cosmic-float 6s ease-in-out infinite",
        "stardust-shimmer": "stardust-shimmer 3s ease-in-out infinite",
        "galaxy-rotation": "galaxy-rotation 20s linear infinite",
        "nebula-breath": "nebula-breath 4s ease-in-out infinite",
        "cosmic-twinkle": "cosmic-twinkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
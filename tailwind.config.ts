// ✏️ TEAM GUIDE: Design tokens live here + CSS variables in src/index.css.
// Brand: primary #0D9488 (teal) · violet #8B5CF6 · amber #F59E0B.
// Change a brand color in index.css (--primary etc.) and everything follows.
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '80rem' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Brand hues (explicit, for gradients / charts / highlights)
        brand: {
          teal: 'hsl(var(--brand-teal))',
          violet: 'hsl(var(--brand-violet))',
          amber: 'hsl(var(--brand-amber))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"IBM Plex Sans Arabic"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      // Fractional steps used across the UI (size-4.5 icons, h-6.5 switch…)
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
      },
      // Extra alpha steps for tinted surfaces (bg-primary/12, bg-brand-amber/18…)
      opacity: {
        12: '0.12',
        18: '0.18',
      },
      boxShadow: {
        soft: '0 2px 10px -2px hsl(var(--foreground) / 0.06), 0 12px 32px -12px hsl(var(--foreground) / 0.12)',
        bloom:
          '0 4px 14px -4px hsl(var(--primary) / 0.18), 0 20px 44px -16px hsl(var(--brand-violet) / 0.25)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.25), 0 8px 32px -8px hsl(var(--primary) / 0.45)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-7px)' },
          '30%': { transform: 'translateX(6px)' },
          '45%': { transform: 'translateX(-4px)' },
          '60%': { transform: 'translateX(3px)' },
          '75%': { transform: 'translateX(-2px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'mesh-pan': {
          '0%, 100%': { backgroundPosition: '0% 0%, 100% 20%, 50% 100%' },
          '50%': { backgroundPosition: '30% 20%, 70% 0%, 20% 80%' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.82)' },
        },
      },
      animation: {
        shake: 'shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'mesh-pan': 'mesh-pan 18s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

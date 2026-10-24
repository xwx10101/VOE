import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#071426',
        navy: '#0B1B33',
        royal: '#123C69',
        ember: '#E63946',
        gold: '#FFB000',
        teal: '#47E6C1',
        insight: '#29BEFD',
        violet: '#A259EA',
        canvas: '#F6F8FB',
        border: '#DCE3EC',
        muted: '#5B6472',
        success: '#2E9D68',
        warning: '#D98900',
        danger: '#C93645',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        control: '14px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(7,20,38,0.04), 0 8px 24px -12px rgba(7,20,38,0.12)',
        lift: '0 2px 4px rgba(7,20,38,0.04), 0 24px 48px -24px rgba(7,20,38,0.28)',
        glow: '0 0 0 1px rgba(71,230,193,0.18), 0 24px 60px -30px rgba(71,230,193,0.45)',
      },
      keyframes: {
        floatSlow: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '0.85' },
        },
        drawLine: {
          from: { strokeDashoffset: '100' },
          to: { strokeDashoffset: '0' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'translate3d(0,16px,0)' },
          to: { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 9s ease-in-out infinite',
        pulseSoft: 'pulseSoft 4s ease-in-out infinite',
        riseIn: 'riseIn 0.5s cubic-bezier(0.22,0.61,0.36,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;

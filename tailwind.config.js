/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Playfair Display', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Noir palette
        noir: {
          bg: '#0a0b0f',
          surface: '#151821',
          card: '#1e2332',
          border: '#2a3441',
          text: '#e8eaed',
          'text-dim': '#9aa0a6',
          'text-muted': '#5f6368',
        },
        // Neon accents
        neon: {
          cyan: '#00d4ff',
          purple: '#8b5cf6',
          amber: '#fbbf24',
          pink: '#ec4899',
          green: '#10b981',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'atmospheric-shift': 'atmosphericShift 20s ease-in-out infinite alternate',
        'progress-shine': 'progressShine 2s ease-in-out infinite',
        'rainfall': 'rainfall linear infinite',
        'game-end-pulse': 'gameEndPulse 2s ease-in-out infinite',
        'spin': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        pulseGlow: {
          '0%': {
            boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
          },
        },
        atmosphericShift: {
          '0%': {
            opacity: '0.3',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(1.05)',
          },
          '100%': {
            opacity: '0.4',
            transform: 'scale(0.95)',
          },
        },
        progressShine: {
          '0%': {
            left: '-100%',
          },
          '50%': {
            left: '100%',
          },
          '100%': {
            left: '100%',
          },
        },
        rainfall: {
          '0%': {
            transform: 'translateY(-100px)',
            opacity: '0',
          },
          '10%': {
            opacity: '1',
          },
          '90%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(calc(100vh + 100px))',
            opacity: '0',
          },
        },
        gameEndPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
        },
        spin: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'elevated': '0 20px 40px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
        'gradient-amber': 'linear-gradient(135deg, #fbbf24, #f97316)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'gradient-success': 'linear-gradient(135deg, #10b981, #059669)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-store-row-amazon',
    'bg-store-row-walmart',
    'bg-store-row-wayfair',
    'bg-store-row-other',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (shadcn/ui) — values live in src/index.css
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          container: 'hsl(var(--primary-container) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        // Teal accent of the Synthetic Naturalist palette
        brand: {
          DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
          foreground: 'hsl(var(--brand-foreground) / <alpha-value>)',
        },
        surface: {
          variant: 'hsl(var(--surface-variant) / <alpha-value>)',
          'container-low': 'hsl(var(--surface-container-low) / <alpha-value>)',
          dim: 'hsl(var(--surface-dim) / <alpha-value>)',
        },
        'on-surface': 'hsl(var(--foreground) / <alpha-value>)',
        'on-surface-variant': 'hsl(var(--on-surface-variant) / <alpha-value>)',
        header: {
          DEFAULT: 'hsl(var(--header) / <alpha-value>)',
          container: 'hsl(var(--header-container) / <alpha-value>)',
        },
        status: {
          blue: 'hsl(var(--status-blue) / <alpha-value>)',
          'blue-fg': 'hsl(var(--status-blue-fg) / <alpha-value>)',
          indigo: 'hsl(var(--status-indigo) / <alpha-value>)',
          'indigo-fg': 'hsl(var(--status-indigo-fg) / <alpha-value>)',
          amber: 'hsl(var(--status-amber) / <alpha-value>)',
          'amber-fg': 'hsl(var(--status-amber-fg) / <alpha-value>)',
          pink: 'hsl(var(--status-pink) / <alpha-value>)',
          'pink-fg': 'hsl(var(--status-pink-fg) / <alpha-value>)',
          slate: 'hsl(var(--status-slate) / <alpha-value>)',
          'slate-fg': 'hsl(var(--status-slate-fg) / <alpha-value>)',
          gray: 'hsl(var(--status-gray) / <alpha-value>)',
          paypal: 'hsl(var(--status-paypal) / <alpha-value>)',
          'paypal-fg': 'hsl(var(--status-paypal-fg) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          container: 'hsl(var(--destructive-container) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        store: {
          amazon: '#FF9900',
          walmart: '#0071DC',
          wayfair: '#7B189F',
          other: '#006a68',
        },
      },
      backgroundColor: {
        'store-row-amazon': 'rgb(255 153 0 / 0.12)',
        'store-row-walmart': 'rgb(0 113 220 / 0.12)',
        'store-row-wayfair': 'rgb(123 24 159 / 0.12)',
        'store-row-other': 'rgb(0 106 104 / 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Georgia', 'ui-serif', 'serif'],
      },
      fontSize: {
        'page-title': ['1.5rem', { lineHeight: '2rem' }],
        'modal-title': ['1.25rem', { lineHeight: '1.75rem' }],
        'section-title': ['1rem', { lineHeight: '1.5rem' }],
        body: ['0.875rem', { lineHeight: '1.3125rem' }],
        label: ['0.8125rem', { lineHeight: '1.125rem' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
        'table-header': ['0.8125rem', { lineHeight: '1.125rem' }],
        'stat-value': ['1.25rem', { lineHeight: '1.5rem' }],
        'stat-label': ['0.75rem', { lineHeight: '1rem' }],
      },
      // Tint steps used by status badges and row highlights (bg-brand/12, bg-primary/8)
      opacity: {
        8: '0.08',
        12: '0.12',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        squircle: '1.25rem',
        'squircle-lg': '2rem',
      },
      boxShadow: {
        navy: '0 12px 32px rgb(var(--shadow-color) / 0.06)',
        'navy-md': '0 12px 32px rgb(var(--shadow-color) / 0.10)',
        'navy-lg': '0 24px 64px rgb(var(--shadow-color) / 0.12)',
        card: '0 20px 40px rgb(var(--shadow-color) / 0.08)',
        soft: '0 2px 12px rgb(var(--shadow-color) / 0.07)',
        'soft-lg': '0 6px 20px rgb(var(--shadow-color) / 0.11)',
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

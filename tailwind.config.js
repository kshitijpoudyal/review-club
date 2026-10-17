import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  // Touch devices get no sticky hover states
  future: {
    hoverOnlyWhenSupported: true,
  },
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
      // System font first: SF Pro on Apple devices ships optical sizing and
      // tracking tables; Segoe UI / Roboto elsewhere.
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      // Size, leading and tracking move together: large type is tight,
      // small type is open.
      fontSize: {
        'large-title': ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.025em' }],
        'page-title': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.022em' }],
        'modal-title': ['1.25rem', { lineHeight: '1.625rem', letterSpacing: '-0.017em' }],
        'section-title': ['1.0625rem', { lineHeight: '1.375rem', letterSpacing: '-0.012em' }],
        body: ['0.9375rem', { lineHeight: '1.375rem', letterSpacing: '-0.008em' }],
        label: ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '-0.003em' }],
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'table-header': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'stat-value': ['1.375rem', { lineHeight: '1.625rem', letterSpacing: '-0.022em' }],
        'stat-label': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
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
      // On a grouped canvas cards separate by tone, so shadows stay faint;
      // bigger floating surfaces get deeper ones.
      boxShadow: {
        navy: '0 1px 2px rgb(var(--shadow-color) / 0.04), 0 4px 16px rgb(var(--shadow-color) / 0.05)',
        'navy-md': '0 0 0 0.5px rgb(var(--shadow-color) / 0.06), 0 10px 32px rgb(var(--shadow-color) / 0.14)',
        'navy-lg': '0 0 0 0.5px rgb(var(--shadow-color) / 0.06), 0 24px 64px rgb(var(--shadow-color) / 0.22)',
        card: '0 1px 2px rgb(var(--shadow-color) / 0.04), 0 4px 16px rgb(var(--shadow-color) / 0.05)',
        soft: '0 1px 2px rgb(var(--shadow-color) / 0.04)',
        'soft-lg': '0 2px 4px rgb(var(--shadow-color) / 0.05), 0 8px 24px rgb(var(--shadow-color) / 0.08)',
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

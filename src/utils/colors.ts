// Global color system — Synthetic Naturalist theme (inspired by HustleBooks)
// Core palette: Navy #022448 · Teal #006a68 · Amber (warning) · Red #ba1a1a · Parchment surfaces

import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Product status types
export type StatusType =
    | 'void'
    | 'complete'
    | 'refund-pending'
    | 'send-screenshot'
    | 'review-pending'
    | 'add-review'
    | 'order-placed'
    | 'unknown'
    | 'linked'
    | 'unlinked'
    | 'unknown';

export const colors = {
    // Status badge colors — one hue per status. `solid` is the same hue at full
    // strength (charts, chip dots) and `dot` applies it to the badge's leading dot.
    status: {
        linked: {
            bg: 'bg-status-paypal/10',
            border: 'border-status-paypal/25',
            text: 'text-status-paypal-fg',
            solid: 'bg-status-paypal',
            dot: 'before:bg-status-paypal'
        },
        unlinked: {
            bg: 'bg-status-amber/12',
            border: 'border-status-amber/30',
            text: 'text-status-amber-fg',
            solid: 'bg-status-amber',
            dot: 'before:bg-status-amber'
        },
        error: {
            bg: 'bg-destructive-container',
            text: 'text-destructive',
            textSecondary: 'text-destructive',
            border: 'border-destructive/20'
        },
        void: {
            bg: 'bg-status-gray/15',
            border: 'border-status-gray/25',
            text: 'text-muted-foreground',
            solid: 'bg-status-gray',
            dot: 'before:bg-status-gray'
        },
        complete: {
            bg: 'bg-brand/12',
            border: 'border-brand/25',
            text: 'text-brand',
            solid: 'bg-brand',
            dot: 'before:bg-brand'
        },
        'refund-pending': {
            bg: 'bg-status-amber/12',
            text: 'text-status-amber-fg',
            border: 'border-status-amber/30',
            solid: 'bg-status-amber',
            dot: 'before:bg-status-amber'
        },
        'send-screenshot': {
            bg: 'bg-status-pink/10',
            text: 'text-status-pink-fg',
            border: 'border-status-pink/25',
            solid: 'bg-status-pink',
            dot: 'before:bg-status-pink'
        },
        'review-pending': {
            bg: 'bg-status-indigo/10',
            text: 'text-status-indigo-fg',
            border: 'border-status-indigo/25',
            solid: 'bg-status-indigo',
            dot: 'before:bg-status-indigo'
        },
        'add-review': {
            bg: 'bg-status-blue/10',
            text: 'text-status-blue-fg',
            border: 'border-status-blue/25',
            solid: 'bg-status-blue',
            dot: 'before:bg-status-blue'
        },
        'order-placed': {
            bg: 'bg-status-slate/10',
            text: 'text-status-slate-fg',
            border: 'border-status-slate/25',
            solid: 'bg-status-slate',
            dot: 'before:bg-status-slate'
        },
        unknown: {
            bg: 'bg-destructive-container',
            text: 'text-destructive',
            border: 'border-destructive/20',
            solid: 'bg-destructive',
            dot: 'before:bg-destructive'
        }
    },

    // Financial/Delta colors
    financial: {
        positive: 'text-brand',
        positiveLight: 'text-brand',
        neutral: 'text-on-surface-variant',
        neutral2: 'text-on-surface-variant',
        negativeLight: 'text-destructive/70',
        negative: 'text-destructive',
        badges: {
            paid: 'text-destructive bg-destructive-container',
            received: 'text-brand bg-brand/10',
            deltaPositive: 'text-brand bg-brand/10',
            deltaNegative: 'text-destructive bg-destructive-container'
        }
    },

    // Text colors — on-surface hierarchy
    text: {
        primary: 'text-foreground',
        secondary: 'text-on-surface-variant',
        muted: 'text-muted-foreground',
        disabled: 'text-status-gray',
        link: 'text-brand',
        linkHover: 'text-primary',
        white: 'text-white',
        green: 'text-brand',
        danger: 'text-destructive',
    },

    // Background surfaces — 3-level parchment system
    background: {
        gradient: 'bg-gradient-to-br from-header to-header-container',
        primary: 'bg-background',
        secondary: 'bg-secondary',
        dark: 'bg-primary',
        muted: 'bg-secondary',
        linkedRow: 'bg-brand/8',
        unlinkedRow: 'bg-status-amber/10',
        voidRow: 'bg-status-gray/15',
    },

    // Card
    card: {
        background: 'bg-card',
        border: 'border border-input/15',
        shadow: 'shadow-[0_12px_32px_rgba(2,36,72,0.06)]',
        value: 'text-foreground',
        label: 'text-on-surface-variant'
    },

    // Buttons — rounded-full; primary uses navy gradient
    button: {
        primary: 'bg-gradient-to-br from-primary to-primary-container hover:from-primary-container hover:to-primary text-primary-foreground focus-visible:outline-primary',
        primaryIcon: 'bg-gradient-to-br from-primary to-primary-container text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
        danger: 'text-destructive hover:bg-destructive-container',
        indigo: 'bg-gradient-to-br from-primary to-primary-container hover:opacity-90 text-primary-foreground focus-visible:outline-primary',
        secondary: 'bg-secondary text-primary hover:bg-surface-variant',
        dangerSolid: 'bg-destructive hover:bg-destructive/80 text-destructive-foreground focus-visible:outline-destructive',
        close: 'text-muted-foreground hover:text-foreground'
    },

    // Form controls
    form: {
        input: {
            base: 'border-0 bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
            error: 'border-destructive bg-destructive-container/40 focus-visible:border-destructive focus-visible:ring-destructive/20',
            disabled: 'bg-secondary border-0 opacity-60',
            text: 'text-foreground',
            placeholder: 'placeholder-muted-foreground'
        },
        label: 'text-label font-medium text-on-surface-variant',
        checkbox: 'text-brand focus:ring-brand'
    },

    // Tabs
    tabs: {
        active: 'border-primary text-primary',
        inactive: 'border-transparent text-muted-foreground hover:text-on-surface-variant hover:border-input'
    },

    // Borders
    border: {
        default: 'border-input/15',
        light: 'border-input/10'
    },

    // Loading/shimmer
    loading: {
        shimmer: 'bg-gradient-to-r from-secondary via-background to-secondary bg-[length:200%_100%] animate-shimmer',
        skeleton: 'bg-surface-variant'
    },

    // Menu/Dropdown
    menu: {
        background: 'bg-background',
        border: 'border border-input/15',
        shadow: 'shadow-[0_12px_32px_rgba(2,36,72,0.08)]',
        outline: 'outline outline-1 -outline-offset-1 outline-input/20'
    },

    // Modal
    modal: {
        overlay: 'bg-primary/30 backdrop-blur-sm',
        overlaySolid: 'bg-primary/40',
        shadow: 'shadow-[0_24px_64px_rgba(2,36,72,0.12)]',
        item: {
            base: 'px-3 py-2 cursor-pointer',
            hover: 'hover:bg-secondary',
            selected: 'bg-brand/10 border-l-4 border-brand',
            unselected: 'hover:bg-secondary'
        },
        search: {
            container: 'border-b border-input/15',
            input: 'w-full px-3 py-2 border-none focus:outline-none bg-transparent',
            placeholder: 'placeholder-muted-foreground'
        },
        void: {
            badge: 'bg-secondary text-on-surface-variant',
            button: 'bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500',
            unvoidButton: 'bg-gradient-to-br from-primary to-primary-container text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary'
        },
        danger: 'text-destructive hover:bg-destructive-container',
        menuButton: 'bg-background text-foreground border border-input/20 hover:bg-secondary focus:border-primary',
        menuItem: 'text-foreground data-[focus]:bg-brand/10 data-[focus]:text-primary hover:bg-brand/10 hover:text-primary'
    },

    // Toolbar filter controls
    filters: {
        container: 'bg-secondary',
        addProductButton: 'bg-gradient-to-br from-primary to-primary-container text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
        searchInput: 'bg-surface-variant border-0 focus:outline-none focus:ring-2 focus:ring-primary',
        select: 'bg-surface-variant border-0 focus:outline-none focus:ring-2 focus:ring-primary',
        clearButton: 'text-muted-foreground hover:text-foreground bg-secondary hover:bg-surface-variant'
    },

    // Header — deep navy
    header: {
        background: 'bg-header',
        backgroundDark: '',
        navigation: {
            link: 'text-white/90 hover:text-white',
            linkHover: 'hover:text-white'
        },
        mobile: {
            menuButton: 'text-white/70 hover:text-white',
            ring: 'sm:ring-white/10',
            closeButton: 'text-white/70 hover:text-white',
            divider: 'divide-white/10',
            menuLink: 'text-white/90 hover:bg-white/10'
        }
    }
} as const;

// Helper functions

export const getFinancialColor = (amount: number | null): string => {
    if (amount === null) return colors.financial.neutral;
    if (amount > 0) return colors.financial.positive;
    if (amount < 0) return colors.financial.negative;
    return colors.financial.neutral;
};

export const getDeltaColor = (delta: number | null): string => {
    return getFinancialColor(delta);
};

/** Pill treatment for a profit/loss figure; zero and unknown stay plain text. */
export const getDeltaPillClasses = (delta: number | null): string => {
    const base = 'inline-flex rounded-full px-2 py-0.5';
    if (delta === null || delta === 0) return `${base} ${colors.text.muted}`;
    return delta > 0
        ? `${base} bg-brand/10 text-brand`
        : `${base} bg-destructive-container/60 text-destructive`;
};

// Solid fills for charts and bars, one per workflow stage
export const statusSolid: Record<string, string> = {
    'order-placed': colors.status['order-placed'].solid,
    'add-review': colors.status['add-review'].solid,
    'review-pending': colors.status['review-pending'].solid,
    'send-screenshot': colors.status['send-screenshot'].solid,
    'refund-pending': colors.status['refund-pending'].solid,
    complete: colors.status.complete.solid,
    void: colors.status.void.solid,
    unknown: colors.status.unknown.solid,
};

export const getRowBackgroundColor = (isLinked: boolean) => {
    return isLinked ? colors.background.linkedRow : colors.background.unlinkedRow;
};

export const getBadgeClasses = (type: StatusType, dot = true) => {
    const s = colors.status[type];
    return cn(badgeVariants({ variant: dot ? 'statusDot' : 'status' }), s.bg, s.text, s.border, dot && s.dot);
};

export const getReviewMediaBadgeClasses = (type: 'photo' | 'video') => {
    const s = type === 'photo' ? colors.status['add-review'] : colors.status['review-pending'];
    return cn(badgeVariants({ variant: 'status' }), s.bg, s.text, s.border);
};

export const getActionButtonClasses = () => {
    return `flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-primary-container text-primary-foreground rounded-full shadow-[0_4px_12px_rgba(2,36,72,0.15)] transition focus:outline-none focus:ring-2 focus:ring-primary`;
};

export const getStatsColor = (type: string, value?: number): string => {
    switch (type) {
        case 'completed':
            return colors.financial.positive;
        case 'paid':
            return colors.financial.neutral;
        case 'received':
            return colors.financial.positive;
        case 'remaining':
            return colors.financial.neutral2;
        case 'netDelta':
            return value !== undefined && value >= 0 ? colors.financial.positive : colors.financial.negative;
        case 'income':
            return colors.financial.neutral;
        case 'fees':
            return colors.financial.negative;
        case 'netReceived':
            return colors.financial.positive;
        case 'transactionCount':
            return colors.financial.neutral;
        case 'unlinkedCount':
            return colors.financial.neutral2;
        default:
            return colors.text.primary;
    }
};

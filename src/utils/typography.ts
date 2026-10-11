/**
 * Centralized typography utilities for ReviewClub.
 * Use these semantic class strings instead of ad-hoc font sizes/weights.
 */

const tabular = 'tabular-nums';

export const typography = {
  pageTitle: 'font-display text-page-title font-semibold tracking-tight text-foreground',
  modalTitle: 'font-display text-modal-title font-semibold text-foreground',
  sectionTitle: 'text-section-title font-semibold text-foreground',
  body: 'text-body font-normal text-foreground',
  bodyStrong: 'text-body font-medium text-foreground',
  label: 'text-label font-medium text-on-surface-variant',
  caption: 'text-caption font-normal text-muted-foreground',
  captionStrong: 'text-caption font-medium text-muted-foreground',
  button: 'text-body font-medium',
  tableHeader: 'text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground',
  tableCell: 'text-body font-normal text-on-surface-variant',
  tableCellStrong: 'text-body font-medium text-foreground',
  statLabel: 'text-stat-label font-medium text-muted-foreground',
  statValue: `font-display text-stat-value font-semibold ${tabular} text-foreground`,
  numeric: `text-body font-medium ${tabular}`,
  numericStrong: `text-body font-semibold ${tabular}`,
  overline: 'text-caption font-medium uppercase tracking-wide text-muted-foreground',
} as const;

export type TypographyToken = keyof typeof typography;

import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about the custom theme keys in tailwind.config.js so
// e.g. `text-body` is merged as a font size rather than mistaken for a colour.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'page-title',
            'modal-title',
            'section-title',
            'body',
            'label',
            'caption',
            'table-header',
            'stat-value',
            'stat-label',
          ],
        },
      ],
      shadow: [{ shadow: ['navy', 'navy-md', 'navy-lg', 'card', 'soft', 'soft-lg'] }],
      rounded: [{ rounded: ['squircle', 'squircle-lg'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

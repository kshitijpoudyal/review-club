import React, { useState } from 'react';
import { typography } from '../../utils/typography';

const IDEAS = [
  'Average days to refund by vendor',
  'ROI by vendor (net delta / paid)',
  'Retailer split (Amazon, Walmart, Wayfair)',
  'Review media mix completion rates',
  'Monthly P&L table with CSV export',
  'Stale refunds (refund-pending > N days)',
  'Link health score over time',
  'Pipeline refund forecast',
];

export const ComingSoonSection: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-gutter">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${typography.captionStrong} text-muted-foreground hover:text-brand transition-colors`}
      >
        {open ? '▼' : '▶'} More analytics ideas (coming soon)
      </button>
      {open && (
        <ul className={`${typography.caption} mt-2 space-y-1 text-muted-foreground list-disc pl-5`}>
          {IDEAS.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

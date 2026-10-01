import React, { useState } from 'react';
import { typography } from '../../utils/typography';
import { copyToClipboard } from '../../utils/clipboard';
import { formatReviewForClipboard, GeneratedReview } from '../../utils/generateReview';

interface GeneratedReviewModalProps {
  isOpen: boolean;
  review: GeneratedReview | null;
  onClose: () => void;
}

const GeneratedReviewModal: React.FC<GeneratedReviewModalProps> = ({ isOpen, review, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !review) return null;

  const handleCopy = async () => {
    await copyToClipboard(formatReviewForClipboard(review));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#fbf9f3] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-full max-w-md overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <h2 className={typography.modalTitle}>Generated Review</h2>
          <button
            onClick={onClose}
            className="text-[#74777f] hover:text-[#1b1c19] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-2 max-h-[50vh] overflow-y-auto">
          <p className={`${typography.bodyStrong} text-[#1b1c19] mb-2`}>{review.title}</p>
          <p className={`${typography.body} text-[#43474e] whitespace-pre-wrap`}>{review.review}</p>
        </div>

        <div className="flex gap-3 px-6 py-6">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 ${typography.button} font-semibold rounded-full border border-[rgba(196,198,207,0.6)] text-[#43474e] bg-[#fbf9f3] hover:bg-[#e4e2dd] transition-colors`}
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 ${typography.button} font-semibold rounded-full bg-[#006a68] text-white hover:bg-[#005452] active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,106,104,0.25)]`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedReviewModal;

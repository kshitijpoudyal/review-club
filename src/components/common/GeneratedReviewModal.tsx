import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Modal from './Modal';
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

  const handleCopy = async () => {
    if (!review) return;
    await copyToClipboard(formatReviewForClipboard(review));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen && !!review}
      onClose={onClose}
      title="Generated Review"
      size="sm"
      className="sm:max-w-md"
      body={review && (
        <div className="px-4 sm:px-6 py-4">
          <p className={`${typography.bodyStrong} text-foreground mb-2`}>{review.title}</p>
          <p className={`${typography.body} text-on-surface-variant whitespace-pre-wrap`}>{review.review}</p>
        </div>
      )}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 font-semibold" onClick={onClose}>
            Close
          </Button>
          <Button
            className="flex-1 font-semibold bg-none bg-brand shadow-[0_4px_12px_rgba(0,106,104,0.25)] hover:bg-brand/90 hover:brightness-100"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      }
    />
  );
};

export default GeneratedReviewModal;

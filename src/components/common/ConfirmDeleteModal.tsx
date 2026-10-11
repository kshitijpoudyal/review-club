import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { typography } from '../../utils/typography';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
}) => (
  <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent className="max-w-sm gap-0 p-0">
      {/* Icon + title */}
      <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive-container flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-destructive" strokeWidth={1.75} />
        </div>
        <AlertDialogTitle className={`${typography.modalTitle} mb-2`}>{title}</AlertDialogTitle>
        <AlertDialogDescription className={`${typography.body} text-on-surface-variant`}>
          {message}
        </AlertDialogDescription>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-6 pb-6">
        <AlertDialogCancel asChild>
          <Button variant="outline" className="flex-1 font-semibold">
            Cancel
          </Button>
        </AlertDialogCancel>
        {/* A plain button, not AlertDialogAction: that would also fire onCancel via onOpenChange */}
        <Button
          variant="destructive"
          className="flex-1 font-semibold shadow-[0_4px_12px_rgba(186,26,26,0.25)]"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDeleteModal;

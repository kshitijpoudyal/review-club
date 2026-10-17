import React, { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    children?: ReactNode;
    header?: ReactNode;
    body?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

// Size classes for responsive modal widths
const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
};

/**
 * Reusable Modal Component
 *
 * A flexible modal built on the shadcn/ui Dialog (Radix), which provides the
 * focus trap, scroll lock, Escape/backdrop dismissal and open/close animation.
 * Below the `md` breakpoint it renders as a swipe-to-dismiss bottom sheet (vaul).
 * Supports custom header, body, and footer content with responsive design.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Function to call when modal should be closed
 * @param title - Optional title for the header (used if header prop not provided)
 * @param size - Size of the modal (sm, md, lg, xl)
 * @param showCloseButton - Whether to show the X close button in header
 * @param header - Custom header content
 * @param body - Custom body content
 * @param footer - Custom footer content
 * @param className - Additional CSS classes for the modal container
 */
const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    showCloseButton = true,
    header,
    body,
    footer,
    className = ''
}) => {
    const isMobile = useIsMobile();
    const Title = isMobile ? DrawerTitle : DialogTitle;
    const Close = isMobile ? DrawerClose : DialogPrimitive.Close;
    const handleOpenChange = (open: boolean) => {
        if (!open) onClose();
    };
    // Toasts render outside the dialog; clicking one shouldn't close it.
    const keepOpenForToasts = (e: Event) => {
        if ((e.target as Element | null)?.closest?.('[data-sonner-toaster]')) {
            e.preventDefault();
        }
    };

    const sections = (
        <>
            {/* Header — custom headers manage their own padding/border */}
            {header ? (
                <div className="flex-shrink-0">
                    <Title className="sr-only">{title || 'Dialog'}</Title>
                    {header}
                </div>
            ) : (title || showCloseButton) ? (
                <div className={`flex-shrink-0 p-4 sm:p-6 border-b ${colors.border.default}`}>
                    <div className="flex justify-between items-center">
                        <Title className={title ? `${typography.modalTitle} ${colors.text.primary}` : 'sr-only'}>
                            {title || 'Dialog'}
                        </Title>
                        {showCloseButton && (
                            <Close
                                className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground -mr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </Close>
                        )}
                    </div>
                </div>
            ) : (
                <Title className="sr-only">Dialog</Title>
            )}

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto modern-scrollbar">
                {body}
            </div>

            {/* Footer */}
            {footer && (
                <div className={`flex-shrink-0 bg-background border-t ${colors.border.default} p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 justify-between`}>
                    {footer}
                </div>
            )}
        </>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                <DrawerContent
                    aria-describedby={undefined}
                    onInteractOutside={keepOpenForToasts}
                    className={cn('max-h-[92svh] overflow-hidden', className)}
                >
                    {sections}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogPortal>
                <DialogOverlay className="flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8">
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        // Keep focus on the panel instead of the first field; explicit autoFocus still wins.
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            const panel = e.currentTarget as HTMLElement;
                            if (!panel.contains(document.activeElement)) panel.focus();
                        }}
                        onInteractOutside={keepOpenForToasts}
                        className={cn(
                            'relative flex max-h-[90svh] w-full flex-col overflow-hidden rounded-2xl',
                            'bg-background shadow-navy-lg focus:outline-none',
                            // Settles without overshoot and leaves the way it came (down)
                            'data-[state=open]:duration-300 data-[state=closed]:duration-200 data-[state=open]:[animation-timing-function:cubic-bezier(0.2,0.8,0.2,1)] data-[state=closed]:[animation-timing-function:cubic-bezier(0.4,0,1,1)] data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
                            'data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4',
                            sizeClasses[size],
                            className
                        )}
                    >
                        {sections}
                    </DialogPrimitive.Content>
                </DialogOverlay>
            </DialogPortal>
        </Dialog>
    );
};

export default Modal;
export type { ModalProps };

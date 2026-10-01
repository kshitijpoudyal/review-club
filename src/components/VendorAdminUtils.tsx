import React, { useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { vendorService } from '../firebase/vendorService';
import { backfillProductsWithVendor } from '../utils/migrations/productVendorMigration';
import { backfillTransactionsWithPaymentMethod } from '../utils/migrations/transactionPaymentMethodMigration';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../utils/colors';
import { typography } from '../utils/typography';

/**
 * Admin utility component for managing vendor setup and migrations
 * This component provides tools to initialize vendors and migrate existing products
 */
export const VendorAdminUtils: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleRunFullSetup = async () => {
    if (!user?.uid) {
      showMessage('Please log in to run the setup.', 'error');
      return;
    }

    try {
      setLoading(true);
      showMessage('Initializing vendors...', 'info');
      await vendorService.initializeVendors(user.uid);

      showMessage('Backfilling products with vendors...', 'info');
      await backfillProductsWithVendor(user.uid);

      showMessage('Vendor setup completed successfully!', 'success');
    } catch (error) {
      console.error('Error during full setup:', error);
      showMessage('Setup failed. Check console for details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillPaymentMethods = async () => {
    if (!user?.uid) {
      showMessage('Please log in to run the backfill.', 'error');
      return;
    }

    try {
      setTxnLoading(true);
      showMessage('Backfilling transaction payment methods...', 'info');
      const count = await backfillTransactionsWithPaymentMethod(user.uid);
      showMessage(
        count > 0
          ? `Backfilled ${count} transaction${count === 1 ? '' : 's'} to "PayPal".`
          : 'All transactions already have a payment method.',
        'success'
      );
    } catch (error) {
      console.error('Error during payment method backfill:', error);
      showMessage('Backfill failed. Check console for details.', 'error');
    } finally {
      setTxnLoading(false);
    }
  };

  const getMessageClasses = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border border-blue-200';
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#43474e]/8 text-[#43474e] border border-[#43474e]/20 flex items-center justify-center shrink-0">
            <WrenchScrewdriverIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className={typography.sectionTitle}>Onboarding and Migrations</h2>
            <p className={typography.caption}>
              Initializes default vendors/payment methods and backfills vendor info on existing products
              and payment method on existing transactions. Safe to run multiple times — it won&apos;t
              duplicate records or overwrite existing assignments.
            </p>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${getMessageClasses()}`}>
                {message}
              </div>
            )}

            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm">
                Please log in to use the migration tools.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[rgba(196,198,207,0.15)] flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handleBackfillPaymentMethods}
            disabled={txnLoading || loading || !user}
            className={`${colors.button.secondary} w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {txnLoading ? 'Processing...' : 'Backfill Transaction Payment Methods'}
          </button>
          <button
            onClick={handleRunFullSetup}
            disabled={loading || txnLoading || !user}
            className={`${colors.button.primary} w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : 'Run Full Setup (Recommended)'}
          </button>
        </div>
      </div>
    </section>
  );
};

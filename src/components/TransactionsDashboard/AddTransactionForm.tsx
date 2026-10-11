import React, { useState } from 'react';
import { Transaction } from '../../types/Transaction';
import { PayPalCSVImporter } from './PayPalCSVImporter';
import { colors } from '../../utils/colors';
import { Modal } from '../common';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AddTransactionFormProps {
  isOpen: boolean;
  onAddTransaction: (transaction: Transaction) => Promise<boolean>;
  onImportTransactions?: (transactions: Transaction[]) => Promise<{ added: number; skipped: number; withdrawalSkipped?: number }>;
  onCancel: () => void;
  isLoading?: boolean;
  hasTransactions?: boolean;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  isOpen,
  onAddTransaction,
  onImportTransactions,
  onCancel,
  isLoading = false,
  hasTransactions = true,
}) => {
  const { activePaymentMethods } = usePaymentMethods();
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('import');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    time: new Date().toTimeString().split(' ')[0], // Current time in HH:MM:SS format
    timeZone: 'PST', // Default timezone
    name: '',
    type: 'General Payment',
    currency: 'USD',
    amount: '',
    fees: '',
    total: '',
    exchangeRate: '',
    receiptId: '',
    transactionId: '',
    itemTitle: '',
    paymentMethod: 'PayPal'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setField(e.target.name, e.target.value);
  };

  const setField = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-calculate total when amount or fees change
    if (name === 'amount' || name === 'fees') {
      const amount = parseFloat(name === 'amount' ? value : formData.amount) || 0;
      const fees = parseFloat(name === 'fees' ? value : formData.fees) || 0;
      const total = amount + fees;

      setFormData(prev => ({
        ...prev,
        [name]: value,
        total: total.toFixed(2)
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.transactionId.trim()) newErrors.transactionId = 'Transaction ID is required';
    if (!formData.amount.trim()) newErrors.amount = 'Amount is required';

    // Numeric validations
    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (formData.fees && isNaN(parseFloat(formData.fees))) {
      newErrors.fees = 'Fees must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Skip "User Initiated Withdrawal" transactions
    if (formData.type === 'User Initiated Withdrawal') {
      alert('User Initiated Withdrawal transactions are not allowed. Please select a different transaction type.');
      return;
    }

    // Convert form data to a Transaction
    const transaction: Transaction = {
      date: formData.date,
      time: formData.time,
      timeZone: formData.timeZone,
      name: formData.name.trim(),
      type: formData.type,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      fees: parseFloat(formData.fees) || 0,
      total: parseFloat(formData.total) || parseFloat(formData.amount),
      transactionId: formData.transactionId.trim(),
      paymentMethod: formData.paymentMethod
    };

    // Add optional fields only if they have values
    if (formData.exchangeRate.trim()) {
      transaction.exchangeRate = formData.exchangeRate.trim();
    }
    if (formData.receiptId.trim()) {
      transaction.receiptId = formData.receiptId.trim();
    }
    if (formData.itemTitle.trim()) {
      transaction.itemTitle = formData.itemTitle.trim();
    }

    const success = await onAddTransaction(transaction);
    if (success) {
      onCancel(); // Close the form on success
    }
  };

  const handleImportComplete = async (transactions: Transaction[]) => {
    if (onImportTransactions) {
      const result = await onImportTransactions(transactions);
      // Close modal after successful import
      if (result.added > 0) {
        onCancel();
      }
      return result;
    }
    return { added: 0, skipped: 0 };
  };

  const modalBody = (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className={`border-b ${colors.border.default} mb-6`}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'manual'
              ? colors.tabs.active
              : colors.tabs.inactive
              }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'import'
              ? colors.tabs.active
              : colors.tabs.inactive
              }`}
          >
            Import CSV
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {
        activeTab === 'manual' ? (
          /* Manual Entry Form */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Date *
              </label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Time *
              </label>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Name */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Payer/Recipient name"
                className={`${errors.name ? colors.form.input.error : ''
 }`}
                required
                disabled={isLoading}
              />
              {errors.name && <p className={`${colors.text.danger} text-sm mt-1`}>{errors.name}</p>}
            </div>

            {/* Payment method */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Payment method
              </label>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod || undefined}
                onValueChange={(value) => setField('paymentMethod', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activePaymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Amount *
              </label>
              <Input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                className={`${errors.amount ? colors.form.input.error : ''
 }`}
                required
                disabled={isLoading}
              />
              {errors.amount && <p className={`${colors.text.danger} text-sm mt-1`}>{errors.amount}</p>}
            </div>

            {/* Fees */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Fees
              </label>
              <Input
                type="number"
                step="0.01"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                placeholder="0.00"
                className={`${errors.fees ? colors.form.input.error : ''
 }`}
                disabled={isLoading}
              />
              {errors.fees && <p className={`${colors.text.danger} text-sm mt-1`}>{errors.fees}</p>}
            </div>

            {/* Total (auto-calculated) */}
            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Total (Auto-calculated)
              </label>
              <Input
                type="number"
                step="0.01"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                placeholder="0.00"
                className={`${colors.form.input.disabled}`}
                disabled={isLoading}
              />
            </div>

            {/* Transaction ID */}
            <div className="md:col-span-2">
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Transaction ID *
              </label>
              <Input
                type="text"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleInputChange}
                placeholder="Unique transaction ID"
                className={`${errors.transactionId ? colors.form.input.error : ''
 }`}
                required
                disabled={isLoading}
              />
              {errors.transactionId && <p className={`${colors.text.danger} text-sm mt-1`}>{errors.transactionId}</p>}
            </div>

            <div>
              <label className={`block text-sm ${colors.form.label} mb-1`}>
                Receipt ID
              </label>
              <Input
                type="text"
                name="receiptId"
                value={formData.receiptId}
                onChange={handleInputChange}
                placeholder="Optional"
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          /* CSV Import Tab */
          <div className="space-y-4">
            <PayPalCSVImporter
              onImportComplete={handleImportComplete}
              showExportHint={!hasTransactions}
            />
          </div>
        )
      }
    </div>
  );

  const modalFooter = activeTab === 'manual' ? (
    <form onSubmit={handleSubmit}>
      <div className="flex space-x-3">
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg text-base"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 py-3 rounded-lg text-base"
        >
          Update
        </Button>
      </div>
    </form>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Add Transaction"
      size="md"
      body={modalBody}
      footer={modalFooter}
    />
  );
};

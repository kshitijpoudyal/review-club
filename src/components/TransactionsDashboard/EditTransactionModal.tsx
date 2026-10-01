import React, { useEffect, useState } from 'react';
import { Transaction } from '../../types/Transaction';
import { Modal } from '../common';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import {
  formFooterCancelClass,
  formFooterPrimaryClass,
  formInputClass,
  formLabelClass,
} from '../ProductDashboard/productFormStyles';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onSave: (docId: string, transaction: Transaction) => Promise<boolean>;
  onClose: () => void;
  isLoading?: boolean;
}

function toTimeInputValue(time: string): string {
  if (!time) return '';
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function toStoredTimeValue(time: string): string {
  if (!time) return '00:00:00';
  return time.length === 5 ? `${time}:00` : time;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { activePaymentMethods } = usePaymentMethods();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    name: '',
    amount: '',
    fees: '',
    total: '',
    transactionId: '',
    itemTitle: '',
    receiptId: '',
    paymentMethod: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !transaction) return;
    setFormData({
      date: transaction.date || '',
      time: toTimeInputValue(transaction.time || ''),
      name: transaction.name || '',
      amount: transaction.amount?.toString() ?? '',
      fees: transaction.fees?.toString() ?? '',
      total: transaction.total?.toString() ?? '',
      transactionId: transaction.transactionId || '',
      itemTitle: transaction.itemTitle || '',
      receiptId: transaction.receiptId || '',
      paymentMethod: transaction.paymentMethod ?? 'PayPal', // dual-read fallback for pre-existing docs
    });
    setErrors({});
  }, [isOpen, transaction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'amount' || name === 'fees') {
        const amount = parseFloat(name === 'amount' ? value : prev.amount) || 0;
        const fees = parseFloat(name === 'fees' ? value : prev.fees) || 0;
        next.total = (amount + fees).toFixed(2);
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.transactionId.trim()) newErrors.transactionId = 'Transaction ID is required';
    if (!formData.amount.trim()) newErrors.amount = 'Amount is required';
    if (formData.amount && Number.isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (formData.fees && Number.isNaN(parseFloat(formData.fees))) {
      newErrors.fees = 'Fees must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction?.id || !validateForm()) return;

    const updated: Transaction = {
      ...transaction,
      date: formData.date,
      time: toStoredTimeValue(formData.time),
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      fees: parseFloat(formData.fees) || 0,
      total: parseFloat(formData.total) || parseFloat(formData.amount),
      transactionId: formData.transactionId.trim(),
      itemTitle: formData.itemTitle.trim() || undefined,
      receiptId: formData.receiptId.trim() || undefined,
      paymentMethod: formData.paymentMethod,
    };

    setSaving(true);
    const success = await onSave(transaction.id, updated);
    setSaving(false);
    if (success) onClose();
  };

  const disabled = isLoading || saving;

  const body = (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="edit-pp-date" className={formLabelClass}>Date</label>
        <input
          id="edit-pp-date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className={formInputClass}
          disabled={disabled}
          required
        />
      </div>
      <div>
        <label htmlFor="edit-pp-time" className={formLabelClass}>Time</label>
        <input
          id="edit-pp-time"
          type="time"
          name="time"
          value={formData.time}
          onChange={handleInputChange}
          className={formInputClass}
          disabled={disabled}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-pp-name" className={formLabelClass}>Name</label>
        <input
          id="edit-pp-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`${formInputClass} ${errors.name ? colors.form.input.error : ''}`}
          disabled={disabled}
          required
        />
        {errors.name && <p className={`${typography.caption} ${colors.text.danger} mt-1`}>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="edit-pp-payment-method" className={formLabelClass}>Payment method</label>
        <select
          id="edit-pp-payment-method"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleInputChange}
          className={formInputClass}
          disabled={disabled}
        >
          {activePaymentMethods.map(pm => (
            <option key={pm.id} value={pm.name}>{pm.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="edit-pp-amount" className={formLabelClass}>Amount</label>
        <input
          id="edit-pp-amount"
          type="number"
          step="0.01"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          className={`${formInputClass} tabular-nums ${errors.amount ? colors.form.input.error : ''}`}
          disabled={disabled}
          required
        />
        {errors.amount && <p className={`${typography.caption} ${colors.text.danger} mt-1`}>{errors.amount}</p>}
      </div>
      <div>
        <label htmlFor="edit-pp-fees" className={formLabelClass}>Fees</label>
        <input
          id="edit-pp-fees"
          type="number"
          step="0.01"
          name="fees"
          value={formData.fees}
          onChange={handleInputChange}
          className={`${formInputClass} tabular-nums ${errors.fees ? colors.form.input.error : ''}`}
          disabled={disabled}
        />
        {errors.fees && <p className={`${typography.caption} ${colors.text.danger} mt-1`}>{errors.fees}</p>}
      </div>
      <div>
        <label htmlFor="edit-pp-total" className={formLabelClass}>Net received</label>
        <input
          id="edit-pp-total"
          type="number"
          step="0.01"
          name="total"
          value={formData.total}
          onChange={handleInputChange}
          className={`${formInputClass} tabular-nums ${colors.form.input.disabled}`}
          disabled={disabled}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-pp-transaction-id" className={formLabelClass}>Transaction ID</label>
        <input
          id="edit-pp-transaction-id"
          type="text"
          name="transactionId"
          value={formData.transactionId}
          onChange={handleInputChange}
          className={`${formInputClass} ${errors.transactionId ? colors.form.input.error : ''}`}
          disabled={disabled}
          required
        />
        {errors.transactionId && (
          <p className={`${typography.caption} ${colors.text.danger} mt-1`}>{errors.transactionId}</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-pp-item-title" className={formLabelClass}>Item title</label>
        <input
          id="edit-pp-item-title"
          type="text"
          name="itemTitle"
          value={formData.itemTitle}
          onChange={handleInputChange}
          className={formInputClass}
          disabled={disabled}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-pp-receipt-id" className={formLabelClass}>Receipt ID</label>
        <input
          id="edit-pp-receipt-id"
          type="text"
          name="receiptId"
          value={formData.receiptId}
          onChange={handleInputChange}
          className={formInputClass}
          disabled={disabled}
        />
      </div>
    </div>
    </div>
  );

  const footer = (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      <button type="button" onClick={onClose} className={formFooterCancelClass} disabled={disabled}>
        Cancel
      </button>
      <button type="submit" className={formFooterPrimaryClass} disabled={disabled}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen && !!transaction}
      onClose={onClose}
      title="Edit Transaction"
      size="md"
      body={body}
      footer={footer}
    />
  );
};

export default EditTransactionModal;

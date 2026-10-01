import React, { useState } from 'react';
import { CreditCardIcon, PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { typography } from '../../utils/typography';
import { colors, getBadgeClasses } from '../../utils/colors';
import { Modal } from '../common';
import { PaymentMethod } from '../../types/PaymentMethod';

const inputClass = `px-3.5 py-2.5 rounded-xl text-sm ${colors.form.input.base}`;

// Cycled per row so payment method initials read as distinct at a glance — purely
// presentational, reusing the app's existing status-tint palette.
const AVATAR_TINTS = [
  'bg-[#006a68]/12 text-[#006a68]',
  'bg-[#6366f1]/12 text-[#4338ca]',
  'bg-[#2563eb]/12 text-[#1d4ed8]',
  'bg-amber-500/12 text-amber-800',
];

const initialsFor = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

const formatCreatedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export const PaymentMethodSettings: React.FC = () => {
  const { activePaymentMethods, loading, error, addPaymentMethod, updatePaymentMethod, deactivatePaymentMethod } = usePaymentMethods();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<PaymentMethod | null>(null);
  const [removing, setRemoving] = useState(false);

  const isDuplicateName = (name: string, excludeId?: string) =>
    activePaymentMethods.some(m => m.id !== excludeId && m.name.trim().toLowerCase() === name.trim().toLowerCase());

  const openAddModal = () => {
    setNewMethodName('');
    setAddError(null);
    setIsAddOpen(true);
  };

  const closeAddModal = () => {
    if (adding) return;
    setIsAddOpen(false);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newMethodName.trim();
    if (!name) {
      setAddError('Payment method name is required.');
      return;
    }
    if (isDuplicateName(name)) {
      setAddError('A payment method with this name already exists.');
      return;
    }
    try {
      setAdding(true);
      setAddError(null);
      await addPaymentMethod({ name, createdAt: new Date().toISOString(), isActive: true });
      setNewMethodName('');
      setIsAddOpen(false);
    } catch (err) {
      setAddError('Failed to add payment method. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditError(null);
  };

  const saveEditing = async (id: string) => {
    const name = editingName.trim();
    if (!name) {
      setEditError('Payment method name is required.');
      return;
    }
    if (isDuplicateName(name, id)) {
      setEditError('A payment method with this name already exists.');
      return;
    }
    try {
      setSavingId(id);
      setEditError(null);
      await updatePaymentMethod(id, { name });
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      await deactivatePaymentMethod(removeTarget.id);
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  const sortedMethods = [...activePaymentMethods].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8 border-b border-[rgba(196,198,207,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#022448]/8 text-[#022448] border border-[#022448]/15 flex items-center justify-center shrink-0">
              <CreditCardIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className={typography.sectionTitle}>Payment Methods</h2>
                {!loading && (
                  <span className={getBadgeClasses('order-placed')}>
                    {activePaymentMethods.length} {activePaymentMethods.length === 1 ? 'method' : 'methods'}
                  </span>
                )}
              </div>
              <p className={typography.caption}>
                Manage the payment methods available when recording or editing transactions. Removing one
                keeps it on past transactions but hides it from new selections.
              </p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className={`${colors.button.primary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0`}
          >
            <PlusIcon className="w-4 h-4" />
            Add payment method
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{error}</div>
        )}
      </div>

      {editError && (
        <div className="mx-4 sm:mx-6 md:mx-8 mt-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{editError}</div>
      )}

      {loading ? (
        <p className={`${typography.caption} p-6`}>Loading payment methods...</p>
      ) : sortedMethods.length === 0 ? (
        <p className={`${typography.caption} p-6`}>No payment methods yet. Add one to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <tbody className="divide-y divide-[rgba(196,198,207,0.15)]">
              {sortedMethods.map((method, index) => {
                const createdLabel = formatCreatedAt(method.createdAt);
                const isEditing = editingId === method.id;

                return (
                  <tr key={method.id} className="hover:bg-[#eae8e2]/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className={`min-w-0 flex-1 ${inputClass}`}
                            autoFocus
                            disabled={savingId === method.id}
                          />
                          <button
                            onClick={() => saveEditing(method.id)}
                            disabled={savingId === method.id}
                            aria-label="Save"
                            className={`${colors.button.secondary} p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={savingId === method.id}
                            aria-label="Cancel"
                            className={`${colors.button.secondary} p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${AVATAR_TINTS[index % AVATAR_TINTS.length]}`}>
                            {initialsFor(method.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1b1c19] block truncate">
                              {method.name}
                            </span>
                            {createdLabel && (
                              <div className={typography.caption}>Created {createdLabel}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(method.id, method.name)}
                          aria-label={`Edit ${method.name}`}
                          className={`${colors.button.secondary} p-2 rounded-full`}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRemoveTarget(method)}
                          aria-label={`Remove ${method.name}`}
                          title="Remove payment method"
                          className={`${colors.button.danger} p-2 rounded-full`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add payment method modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={closeAddModal}
        title="Add payment method"
        size="sm"
        body={
          <div className="p-4 sm:p-6 space-y-2">
            <input
              type="text"
              value={newMethodName}
              onChange={e => {
                setNewMethodName(e.target.value);
                if (addError) setAddError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="Enter payment method name..."
              className={`w-full ${inputClass}`}
              autoFocus
              disabled={adding}
            />
            {addError && <p className="text-red-700 text-sm">{addError}</p>}
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAddModal}
              disabled={adding}
              className={`${colors.button.secondary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={adding}
              className={`${colors.button.primary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {adding ? 'Adding...' : 'Add payment method'}
            </button>
          </div>
        }
      />

      {/* Remove confirmation modal */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => !removing && setRemoveTarget(null)}
        title="Remove payment method"
        size="sm"
        body={
          <div className="p-4 sm:p-6">
            <p className={typography.body}>
              Remove <span className="font-semibold">{removeTarget?.name}</span>? It&apos;ll stay on past
              transactions but disappear from payment method selection for new ones. You can&apos;t undo this from here.
            </p>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
              className={`${colors.button.secondary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={removing}
              className={`${colors.button.dangerSolid} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {removing ? 'Removing...' : 'Remove payment method'}
            </button>
          </div>
        }
      />
    </section>
  );
};

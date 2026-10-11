import React, { useState } from 'react';
import { TruckIcon, PencilIcon, ArchiveBoxIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useVendors } from '../../hooks/useVendors';
import { typography } from '../../utils/typography';
import { colors, getBadgeClasses } from '../../utils/colors';
import { Modal } from '../common';
import { Vendor } from '../../types/Product';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// Cycled per row so vendor initials read as distinct at a glance — purely
// presentational, reusing the app's existing status-tint palette.
const AVATAR_TINTS = [
  'bg-brand/12 text-brand',
  'bg-status-indigo/12 text-status-indigo-fg',
  'bg-status-blue/12 text-status-blue-fg',
  'bg-status-amber/12 text-status-amber-fg',
];

const initialsFor = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

const formatCreatedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export const VendorSettings: React.FC = () => {
  const { activeVendors, loading, error, addVendor, updateVendor, deactivateVendor } = useVendors();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<Vendor | null>(null);
  const [removing, setRemoving] = useState(false);

  const isDuplicateName = (name: string, excludeId?: string) =>
    activeVendors.some(v => v.id !== excludeId && v.name.trim().toLowerCase() === name.trim().toLowerCase());

  const openAddModal = () => {
    setNewVendorName('');
    setAddError(null);
    setIsAddOpen(true);
  };

  const closeAddModal = () => {
    if (adding) return;
    setIsAddOpen(false);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newVendorName.trim();
    if (!name) {
      setAddError('Vendor name is required.');
      return;
    }
    if (isDuplicateName(name)) {
      setAddError('A vendor with this name already exists.');
      return;
    }
    try {
      setAdding(true);
      setAddError(null);
      await addVendor({ name, createdAt: new Date().toISOString(), isActive: true });
      setNewVendorName('');
      setIsAddOpen(false);
    } catch (err) {
      setAddError('Failed to add vendor. Please try again.');
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
      setEditError('Vendor name is required.');
      return;
    }
    if (isDuplicateName(name, id)) {
      setEditError('A vendor with this name already exists.');
      return;
    }
    try {
      setSavingId(id);
      setEditError(null);
      await updateVendor(id, { name });
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
      await deactivateVendor(removeTarget.id);
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  const sortedVendors = [...activeVendors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8 border-b border-input/15">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/8 text-primary border border-primary/15 flex items-center justify-center shrink-0">
              <TruckIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className={typography.sectionTitle}>Vendors</h2>
                {!loading && (
                  <span className={getBadgeClasses('order-placed', false)}>
                    {activeVendors.length} {activeVendors.length === 1 ? 'vendor' : 'vendors'}
                  </span>
                )}
              </div>
              <p className={typography.caption}>
                Manage vendors available when adding products. Archived vendors remain on existing products
                but won&apos;t appear in new selections.
              </p>
            </div>
          </div>
          <Button
            onClick={openAddModal}
            className="rounded-xl gap-1.5 shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            Add vendor
          </Button>
        </div>

        {error && (
          <div className="mt-3 bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">{error}</div>
        )}
      </div>

      {editError && (
        <div className="mx-4 sm:mx-6 md:mx-8 mt-4 bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">{editError}</div>
      )}

      {loading ? (
        <p className={`${typography.caption} p-6`}>Loading vendors...</p>
      ) : sortedVendors.length === 0 ? (
        <p className={`${typography.caption} p-6`}>No vendors yet. Add one to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse text-sm">
            <TableBody className="divide-y divide-input/15">
              {sortedVendors.map((vendor, index) => {
                const createdLabel = formatCreatedAt(vendor.createdAt);
                const isEditing = editingId === vendor.id;

                return (
                  <TableRow key={vendor.id} className="hover:bg-secondary/40">
                    <TableCell className="py-4 px-4 sm:px-6">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="min-w-0 flex-1"
                            autoFocus
                            disabled={savingId === vendor.id}
                          />
                          <Button
                            variant="secondary"
                            onClick={() => saveEditing(vendor.id)}
                            disabled={savingId === vendor.id}
                            aria-label="Save"
                            className="p-2 rounded-full shrink-0"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={cancelEditing}
                            disabled={savingId === vendor.id}
                            aria-label="Cancel"
                            className="p-2 rounded-full shrink-0"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${AVATAR_TINTS[index % AVATAR_TINTS.length]}`}>
                            {initialsFor(vendor.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground block truncate">
                              {vendor.name}
                            </span>
                            {createdLabel && (
                              <div className={typography.caption}>Added {createdLabel}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => startEditing(vendor.id, vendor.name)}
                          aria-label={`Edit ${vendor.name}`}
                          className="p-2 rounded-full"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <button
                          onClick={() => setRemoveTarget(vendor)}
                          aria-label={`Archive ${vendor.name}`}
                          title="Archive vendor"
                          className={`${colors.button.danger} p-2 rounded-full`}
                        >
                          <ArchiveBoxIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add vendor modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={closeAddModal}
        title="Add vendor"
        size="sm"
        body={
          <div className="p-4 sm:p-6 space-y-2">
            <Input
              type="text"
              value={newVendorName}
              onChange={e => {
                setNewVendorName(e.target.value);
                if (addError) setAddError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="Enter vendor name..."
              className="w-full"
              autoFocus
              disabled={adding}
            />
            {addError && <p className="text-destructive text-sm">{addError}</p>}
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={closeAddModal}
              disabled={adding}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleAdd()}
              disabled={adding}
              className="rounded-xl"
            >
              {adding ? 'Adding...' : 'Add vendor'}
            </Button>
          </div>
        }
      />

      {/* Archive confirmation modal */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => !removing && setRemoveTarget(null)}
        title="Archive vendor?"
        size="sm"
        body={
          <div className="p-4 sm:p-6">
            <p className={typography.body}>
              <span className="font-semibold">{removeTarget?.name}</span> will no longer be available for new
              products. Existing products using this vendor will remain unchanged.
            </p>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={confirmRemove}
              disabled={removing}
              className="rounded-xl"
            >
              {removing ? 'Archiving...' : 'Archive vendor'}
            </Button>
          </div>
        }
      />
    </section>
  );
};

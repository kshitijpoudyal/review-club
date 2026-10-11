import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductTable from '../components/ProductDashboard/ProductTable';
import AddProductForm from '../components/ProductDashboard/AddProductForm';
import { usePendingRetailerImport } from '../hooks/usePendingRetailerImport';
import { PendingGmailImports } from '../components/ProductDashboard/PendingGmailImports';
import { BookmarkletPayload } from '../utils/bookmarklet';
import { useAuth } from '../hooks/useAuth';
import { useProductFilters } from '../hooks/useProductFilters';
import { useGenericFilters } from '../hooks/useGenericFilters';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDataSource } from '../hooks/useDataSource';
import { useProductStats } from '../hooks/useProductStats';
import { useSortedProducts } from '../hooks/useSortedProducts';
import { useMinimumLoading } from '../hooks/useMinimumLoading';
import { useVendors } from '../hooks/useVendors';
import { useTransactions } from '../hooks/useTransactions';
import { StatusFilter, DeltaFilter, VendorFilter, Product } from '../types/Product';
import NextActionsStrip from '../components/ProductDashboard/NextActionsStrip';
import GettingStartedPanel from '../components/ProductDashboard/GettingStartedPanel';
import { ParsedProductImport } from '../utils/productCSVParser';
import {
  DashboardContainer,
  DashboardStats,
  DashboardError,
  DashboardSection,
  FilterControlConfig,
  PullToRefresh,
  useToast
} from '../components/common';
import Toolbar from '../components/common/Toolbar';
import { getStatsColor } from '../utils/colors';
import { formatCurrency } from '../utils/currency';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { springBouncy } from '@/lib/motion';

/**
 * ProductPage Component
 * 
 * Main dashboard for managing Amazon products and tracking their status.
 * Features:
 * - Product listing with filters and search
 * - Statistical overview of products
 * - Add/edit/delete product functionality
 * - Status tracking and management
 */
const ProductPage: React.FC = () => {
  const { user } = useAuth();
  const { activeVendors } = useVendors();
  const { showToast } = useToast();
  
  const location = useLocation();
  const urlStatus = new URLSearchParams(location.search).get('status') ?? '';

  // Dashboard state management
  const { showAddForm, handleShowAddForm, handleHideAddForm } = useDashboardState();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { pendingImport, dismissImport } = usePendingRetailerImport(!!user);
  const [externalImport, setExternalImport] = useState<{
    payload: BookmarkletPayload;
    productIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!pendingImport) return;
    setExternalImport({ payload: pendingImport, productIndex: 0 });
    handleShowAddForm();
    dismissImport();
  }, [pendingImport, handleShowAddForm, dismissImport]);

  const handleAddGmailImport = useCallback((payload: BookmarkletPayload, productIndex: number = 0) => {
    setExternalImport({ payload, productIndex });
    handleShowAddForm();
  }, [handleShowAddForm]);

  // Filter state management
  const {
    updateFilter,
    clearFilters: clearAllFilters,
    getFilterValue
  } = useGenericFilters({
    initialFilters: {
      searchTerm: '',
      statusFilter: urlStatus,
      deltaFilter: '',
      vendorFilter: ''
    }
  });

  // Extract filter values for backward compatibility
  const searchTerm = getFilterValue('searchTerm');
  const statusFilter = getFilterValue('statusFilter') as StatusFilter;
  const deltaFilter = getFilterValue('deltaFilter') as DeltaFilter;
  const vendorFilter = getFilterValue('vendorFilter') as VendorFilter;

  // Data source management with optimized hook
  const {
    data,
    loading,
    error,
    updateProduct,
    addProduct,
    importProductsFromCSV,
    deleteProduct,
    refetch,
  } = useDataSource(user?.uid);

  const { data: transactionsData } = useTransactions();

  const unlinkedTransactionStats = useMemo(() => {
    const unlinked = (transactionsData?.transactions || []).filter(
      (t) => !t.linkedProductIds || t.linkedProductIds.length === 0
    );
    return {
      count: unlinked.length,
      amount: unlinked.reduce((sum, t) => sum + t.total, 0),
    };
  }, [transactionsData?.transactions]);

  // Enforce minimum loading time of 3 seconds
  const displayLoading = useMinimumLoading(loading);

  // Product filtering and sorting
  const { applyFilters } = useProductFilters(data?.products || []);
  const filteredProducts = useSortedProducts(applyFilters, searchTerm, statusFilter, deltaFilter, vendorFilter);

  // Stats calculation
  const stats = useProductStats(filteredProducts);

  // Callback handlers
  const handleAddProduct = useCallback((product: Product) => {
    addProduct(product);
    handleHideAddForm();
    setExternalImport(null);
    showToast('Product added');
  }, [addProduct, handleHideAddForm, showToast]);

  const handleUpdateProduct = useCallback((index: number, product: Product) => {
    updateProduct(index, product);
    showToast('Product updated');
  }, [updateProduct, showToast]);

  const handleDeleteProduct = useCallback((productId: string) => {
    deleteProduct(productId);
    showToast('Product deleted', 'error');
  }, [deleteProduct, showToast]);

  const handleImportProducts = useCallback(async (products: ParsedProductImport[]) => {
    const result = await importProductsFromCSV(products as Product[]);
    if (result.added > 0) {
      showToast(`Imported ${result.added} product${result.added === 1 ? '' : 's'}`);
    }
    return result;
  }, [importProductsFromCSV, showToast]);

  const totalProductCount = data?.products.length ?? 0;
  const showGettingStarted = !displayLoading && totalProductCount === 0;

  // Configure filter controls
  const filterConfigs: FilterControlConfig[] = [
    {
      type: 'search',
      key: 'searchTerm',
      placeholder: 'Search product name, order #...',
      value: searchTerm,
      onChange: (value) => updateFilter('searchTerm', value)
    },
    {
      type: 'select',
      key: 'statusFilter',
      value: statusFilter,
      onChange: (value) => updateFilter('statusFilter', value),
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'order-placed', label: 'Order Placed' },
        { value: 'add-review', label: 'Add Review' },
        { value: 'review-pending', label: 'Review Pending' },
        { value: 'send-screenshot', label: 'Send Screenshot' },
        { value: 'refund-pending', label: 'Refund Pending' },
        { value: 'complete', label: 'Complete' },
        { value: 'void', label: 'Void' }
      ]
    },
    {
      type: 'select',
      key: 'deltaFilter',
      value: deltaFilter,
      onChange: (value) => updateFilter('deltaFilter', value),
      options: [
        { value: '', label: 'All Deltas' },
        { value: 'positive', label: 'Positive' },
        { value: 'negative', label: 'Negative' },
        { value: 'zero', label: 'Zero' }
      ]
    },
    {
      type: 'select',
      key: 'vendorFilter',
      value: vendorFilter,
      onChange: (value) => updateFilter('vendorFilter', value),
      options: [
        { value: '', label: 'All Vendors' },
        ...activeVendors.map(vendor => ({
          value: vendor.id,
          label: vendor.name
        }))
      ]
    }
  ];

  // Configure actions for DashboardActions component
  const actions = [
    {
      label: "Add Product",
      onClick: handleShowAddForm,
      variant: 'primary' as const,
      disabled: displayLoading,
      mobileHidden: true
    }
  ];

  // On mobile, bring the sticky toolbar (search bar) to the top so the
  // filtered list is what the user sees.
  const scrollToolbarIntoViewOnMobile = useCallback(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobile) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    toolbarRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const handleStatusFilterFromStrip = useCallback((filter: StatusFilter) => {
    updateFilter('statusFilter', filter);
    if (filter) scrollToolbarIntoViewOnMobile();
  }, [updateFilter, scrollToolbarIntoViewOnMobile]);

  // Apply `?status=` whenever a navigation lands here with one (e.g. tapping
  // a notification while this page is already mounted). Keyed on
  // location.key so re-tapping the same link re-applies the filter. The
  // initial mount is already covered by the hook's initial state, and we
  // skip the scroll there because the layout is still settling.
  const isFirstLocationRef = useRef(true);
  useEffect(() => {
    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
      return;
    }
    if (!urlStatus) return;
    updateFilter('statusFilter', urlStatus);
    scrollToolbarIntoViewOnMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  if (error) {
    return (
      <DashboardError
        error={`Error loading data: ${error}`}
        additionalInfo={undefined}
      />
    );
  }

  // Prepare stats data for the common component
  const statsData = stats ? [
    {
      value: stats.totalProducts || '-',
      label: "Total Products"
    },
    {
      value: stats.completedOrders || '-',
      label: "Completed",
      className: getStatsColor('completed')
    },
    {
      value: formatCurrency(stats.totalPaid),
      label: "Total Paid",
      className: getStatsColor('paid')
    },
    {
      value: formatCurrency(stats.totalReceived),
      label: "Received",
      className: getStatsColor('received')
    },
    {
      value: `~${formatCurrency(stats.remainingRefund)}`,
      label: "Remaining",
      className: getStatsColor('remaining')
    },
    {
      value: formatCurrency(stats.netDelta),
      label: "Delta",
      className: getStatsColor('netDelta', stats.netDelta)
    }
  ] : [];

  return (
    <PullToRefresh onRefresh={refetch} disabled={displayLoading}>
    <DashboardContainer className="pb-20 md:pb-0">
      {/* Compact financial summary */}
      <DashboardStats stats={statsData} loading={displayLoading} />

      <PendingGmailImports onAdd={handleAddGmailImport} />

      {/* Workflow queue */}
      <NextActionsStrip
        products={data?.products || []}
        activeStatusFilter={statusFilter}
        onStatusFilter={handleStatusFilterFromStrip}
        unlinkedTransactionCount={unlinkedTransactionStats.count}
        unlinkedTransactionAmount={unlinkedTransactionStats.amount}
      />

      <Toolbar
        ref={toolbarRef}
        actions={actions}
        filters={filterConfigs}
        onClearFilters={clearAllFilters}
        loading={displayLoading}
      />

      {showGettingStarted && (
        <GettingStartedPanel
          onImportProducts={handleImportProducts}
        />
      )}

      {/* Product Table */}
      <DashboardSection>
        <ProductTable
          products={filteredProducts}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onClearFilters={clearAllFilters}
          loading={displayLoading}
          userId={user?.uid}
          hasAnyProducts={totalProductCount > 0}
        />
      </DashboardSection>

      {/* Add Product Modal */}
      <AddProductForm
        isOpen={showAddForm}
        onAdd={handleAddProduct}
        onCancel={() => {
          handleHideAddForm();
          setExternalImport(null);
        }}
        externalImport={externalImport}
        onExternalImportApplied={() => setExternalImport(null)}
      />

      {/* Mobile FAB — floating Add Product button */}
      {/* Portalled so the page-transition transform doesn't re-anchor this fixed button */}
      {!displayLoading && createPortal(
        <motion.button
          onClick={handleShowAddForm}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          whileTap={{ scale: 0.9 }}
          transition={springBouncy}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-primary-foreground rounded-full shadow-[0_8px_24px_rgb(var(--shadow-color)/0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Add product"
        >
          <Plus className="w-7 h-7" />
        </motion.button>,
        document.body
      )}
    </DashboardContainer>
    </PullToRefresh>
  );
};

export default ProductPage;

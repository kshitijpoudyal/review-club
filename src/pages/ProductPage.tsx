import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePayPalTransactions } from '../hooks/usePayPalTransactions';
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
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlStatus = urlParams.get('status') ?? '';

  // Dashboard state management
  const { showAddForm, handleShowAddForm, handleHideAddForm } = useDashboardState();
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

  const handleAddGmailImport = useCallback((payload: BookmarkletPayload) => {
    setExternalImport({ payload, productIndex: 0 });
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

  const { data: paypalData } = usePayPalTransactions();

  const unlinkedPayPalStats = useMemo(() => {
    const unlinked = (paypalData?.transactions || []).filter(
      (t) => !t.linkedProductIds || t.linkedProductIds.length === 0
    );
    return {
      count: unlinked.length,
      amount: unlinked.reduce((sum, t) => sum + t.total, 0),
    };
  }, [paypalData?.transactions]);

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
      value: formatCurrency(stats.remainingRefund),
      label: "Remaining",
      className: getStatsColor('remaining')
    },
    {
      value: formatCurrency(stats.netDelta),
      label: "Net P&L",
      className: getStatsColor('netDelta', stats.netDelta)
    }
  ] : [];

  return (
    <PullToRefresh onRefresh={refetch} disabled={displayLoading}>
    <DashboardContainer className="pb-24 md:pb-0">
      {/* Compact financial summary */}
      <DashboardStats stats={statsData} loading={displayLoading} />

      <PendingGmailImports onAdd={handleAddGmailImport} />

      {/* Workflow queue */}
      <NextActionsStrip
        products={data?.products || []}
        activeStatusFilter={statusFilter}
        onStatusFilter={(filter) => updateFilter('statusFilter', filter)}
        unlinkedPayPalCount={unlinkedPayPalStats.count}
        unlinkedPayPalAmount={unlinkedPayPalStats.amount}
      />

      <Toolbar
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
      {!displayLoading && (
        <button
          onClick={handleShowAddForm}
          className="fixed bottom-6 right-6 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#022448] to-[#1e3a5f] text-white rounded-full shadow-[0_8px_24px_rgba(2,36,72,0.25)] hover:shadow-[0_12px_32px_rgba(2,36,72,0.35)] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#022448] focus:ring-offset-2"
          aria-label="Add product"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </DashboardContainer>
    </PullToRefresh>
  );
};

export default ProductPage;

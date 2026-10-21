import { useMemo } from 'react';
import { Product, StatusFilter, DeltaFilter, VendorFilter, StoreFilter } from '../types/Product';

export const useSortedProducts = (
  applyFilters: (searchTerm: string, statusFilter: StatusFilter, deltaFilter: DeltaFilter, vendorFilter?: VendorFilter, storeFilter?: StoreFilter) => Product[],
  searchTerm: string,
  statusFilter: StatusFilter,
  deltaFilter: DeltaFilter,
  vendorFilter?: VendorFilter,
  storeFilter?: StoreFilter
) => {
  return useMemo(() => {
    const filtered = applyFilters(searchTerm, statusFilter, deltaFilter, vendorFilter, storeFilter);
    
    // Sort by order date (most recent first), then by item name
    return filtered.sort((a, b) => {
      // Handle items without order dates - they appear last
      if (!a.orderDate && !b.orderDate) {
        return a.item.localeCompare(b.item);
      }
      if (!a.orderDate) return 1; // a goes after b
      if (!b.orderDate) return -1; // a goes before b
      
      // Both have order dates - sort by date (most recent first)
      const dateA = new Date(a.orderDate);
      const dateB = new Date(b.orderDate);
      const dateDiff = dateB.getTime() - dateA.getTime();
      
      // If dates are the same, sort by item name
      if (dateDiff === 0) {
        return a.item.localeCompare(b.item);
      }
      
      return dateDiff;
    });
  }, [applyFilters, searchTerm, statusFilter, deltaFilter, vendorFilter, storeFilter]);
};

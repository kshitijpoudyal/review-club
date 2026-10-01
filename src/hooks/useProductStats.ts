import { useMemo } from 'react';
import { Product } from '../types/Product';
import { isComplete } from '../utils/productStatus';

export interface ProductStats {
  totalProducts: number;
  completedOrders: number;
  totalPaid: number;
  totalReceived: number;
  netDelta: number;
  remainingRefund: number;
}

export const useProductStats = (products: Product[]): ProductStats | null => {
  return useMemo(() => {
    if (!products?.length) return null;

    // Filter out empty products
    const validProducts = products.filter(p => p.item);
    
    const completedOrders = validProducts.filter(p => isComplete(p)).length;

    let totalPaid = 0;
    let totalReceived = 0;
    let netDelta = 0;
    let remainingRefund = 0;

    validProducts.forEach(product => {
      // Add paid amount
      if (product.paid !== null && !isNaN(product.paid)) {
        totalPaid += product.paid;
      }
      
      // Add received amount
      if (product.received !== null && !isNaN(product.received)) {
        totalReceived += product.received;
      }
      
      // Add delta
      if (product.delta !== null && !isNaN(product.delta)) {
        netDelta += product.delta;
      }

      // Calculate remaining refund for incomplete, non-void orders
      const complete = isComplete(product);

      if (!complete && !product.isVoid && product.paid !== null && !isNaN(product.paid)) {
        const received = product.received ?? 0;
        remainingRefund += Math.max(product.paid - received, 0);
      }
    });

    return {
      totalProducts: validProducts.length,
      completedOrders,
      totalPaid,
      totalReceived,
      netDelta,
      remainingRefund
    };
  }, [products]);
};

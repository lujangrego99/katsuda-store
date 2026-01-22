/**
 * Pricing utilities for Katsuda Store
 */

// Discount percentage for bank transfer payments
export const TRANSFER_DISCOUNT = 0.09; // 9%

// Number of installments without interest
export const INSTALLMENTS_COUNT = 12;

/**
 * Calculate the transfer price (with 9% discount)
 */
export function calculateTransferPrice(price: number): number {
  return Math.round(price * (1 - TRANSFER_DISCOUNT));
}

/**
 * Calculate installment amount (without interest)
 */
export function calculateInstallment(price: number, installments: number = INSTALLMENTS_COUNT): number {
  return Math.round(price / installments);
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: { price: number; quantity: number }[]): {
  subtotal: number;
  transferSubtotal: number;
  itemCount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const transferSubtotal = calculateTransferPrice(subtotal);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, transferSubtotal, itemCount };
}

/**
 * Check if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(subtotal: number, freeShippingMinimum: number): boolean {
  return subtotal >= freeShippingMinimum;
}

/**
 * Calculate amount remaining for free shipping
 */
export function amountForFreeShipping(subtotal: number, freeShippingMinimum: number): number {
  const remaining = freeShippingMinimum - subtotal;
  return remaining > 0 ? remaining : 0;
}

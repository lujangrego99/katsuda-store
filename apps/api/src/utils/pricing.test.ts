import { describe, it, expect } from 'vitest';
import {
  calculateTransferPrice,
  calculateInstallment,
  calculateCartTotals,
  qualifiesForFreeShipping,
  amountForFreeShipping,
  TRANSFER_DISCOUNT,
  INSTALLMENTS_COUNT,
} from './pricing';

describe('Pricing Utils', () => {
  describe('calculateTransferPrice', () => {
    it('should apply 9% discount', () => {
      expect(calculateTransferPrice(10000)).toBe(9100);
      expect(calculateTransferPrice(100000)).toBe(91000);
    });

    it('should round to nearest integer', () => {
      expect(calculateTransferPrice(1000)).toBe(910);
      expect(calculateTransferPrice(999)).toBe(909); // 999 * 0.91 = 909.09
    });

    it('should handle zero', () => {
      expect(calculateTransferPrice(0)).toBe(0);
    });

    it('should use correct discount constant', () => {
      expect(TRANSFER_DISCOUNT).toBe(0.09);
    });
  });

  describe('calculateInstallment', () => {
    it('should divide by 12 installments by default', () => {
      expect(calculateInstallment(12000)).toBe(1000);
      expect(calculateInstallment(120000)).toBe(10000);
    });

    it('should support custom installment count', () => {
      expect(calculateInstallment(10000, 10)).toBe(1000);
      expect(calculateInstallment(10000, 6)).toBe(1667);
    });

    it('should round to nearest integer', () => {
      expect(calculateInstallment(10000)).toBe(833); // 10000 / 12 = 833.33
    });

    it('should use correct installments constant', () => {
      expect(INSTALLMENTS_COUNT).toBe(12);
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate correct totals for single item', () => {
      const items = [{ price: 10000, quantity: 1 }];
      const result = calculateCartTotals(items);

      expect(result.subtotal).toBe(10000);
      expect(result.transferSubtotal).toBe(9100);
      expect(result.itemCount).toBe(1);
    });

    it('should calculate correct totals for multiple items', () => {
      const items = [
        { price: 5000, quantity: 2 },
        { price: 3000, quantity: 3 },
      ];
      const result = calculateCartTotals(items);

      expect(result.subtotal).toBe(19000); // 5000*2 + 3000*3
      expect(result.transferSubtotal).toBe(17290); // 19000 * 0.91
      expect(result.itemCount).toBe(5); // 2 + 3
    });

    it('should handle empty cart', () => {
      const result = calculateCartTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.transferSubtotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe('qualifiesForFreeShipping', () => {
    const minimum = 50000;

    it('should return true when subtotal >= minimum', () => {
      expect(qualifiesForFreeShipping(50000, minimum)).toBe(true);
      expect(qualifiesForFreeShipping(100000, minimum)).toBe(true);
    });

    it('should return false when subtotal < minimum', () => {
      expect(qualifiesForFreeShipping(49999, minimum)).toBe(false);
      expect(qualifiesForFreeShipping(0, minimum)).toBe(false);
    });
  });

  describe('amountForFreeShipping', () => {
    const minimum = 50000;

    it('should return remaining amount when below minimum', () => {
      expect(amountForFreeShipping(30000, minimum)).toBe(20000);
      expect(amountForFreeShipping(49999, minimum)).toBe(1);
    });

    it('should return 0 when at or above minimum', () => {
      expect(amountForFreeShipping(50000, minimum)).toBe(0);
      expect(amountForFreeShipping(100000, minimum)).toBe(0);
    });
  });
});

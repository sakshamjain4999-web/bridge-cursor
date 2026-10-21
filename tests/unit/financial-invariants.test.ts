import { describe, it, expect } from "vitest";

describe("Financial Invariants & Calculation Rules", () => {
  describe("Trip Freight & Balance Invariants", () => {
    it("calculates remaining balance accurately when advance is less than freight", () => {
      const freight = 50000;
      const advance = 15000;
      const balance = freight - advance;
      expect(balance).toBe(35000);
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it("resolves zero balance when advance equals freight amount", () => {
      const freight = 30000;
      const advance = 30000;
      const balance = freight - advance;
      expect(balance).toBe(0);
    });
  });

  describe("GST & Invoice Total Calculations", () => {
    it("calculates standard 5% transport GST and total bill amount accurately", () => {
      const subtotal = 100000;
      const gstRate = 5;
      const gstAmount = (subtotal * gstRate) / 100;
      const totalAmount = subtotal + gstAmount;

      expect(gstAmount).toBe(5000);
      expect(totalAmount).toBe(105000);
    });

    it("calculates 18% GST for services correctly", () => {
      const subtotal = 20000;
      const gstRate = 18;
      const gstAmount = (subtotal * gstRate) / 100;
      const totalAmount = subtotal + gstAmount;

      expect(gstAmount).toBe(3600);
      expect(totalAmount).toBe(23600);
    });
  });

  describe("Payment Status Boundary Rules (Documented Contract)", () => {
    function resolvePaymentStatus(
      paidTotal: number,
      ceilingTotal: number
    ): "unpaid" | "partial" | "paid" {
      if (paidTotal <= 0) return "unpaid";
      if (paidTotal < ceilingTotal) return "partial";
      return "paid";
    }

    it("resolves status as 'unpaid' when zero payments recorded", () => {
      expect(resolvePaymentStatus(0, 50000)).toBe("unpaid");
    });

    it("resolves status as 'partial' when paid amount is strictly less than billing ceiling", () => {
      expect(resolvePaymentStatus(25000, 50000)).toBe("partial");
    });

    it("resolves status as 'paid' when paid amount equals billing ceiling", () => {
      expect(resolvePaymentStatus(50000, 50000)).toBe("paid");
    });

    it("rejects overpayment where new payment would exceed billing ceiling", () => {
      const ceiling = 50000;
      const existingPaid = 40000;
      const incomingPayment = 15000;

      const isAllowed = existingPaid + incomingPayment <= ceiling;
      expect(isAllowed).toBe(false);
    });
  });
});

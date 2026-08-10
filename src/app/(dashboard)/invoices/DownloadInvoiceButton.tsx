"use client";

import React from "react";
import { Download } from "lucide-react";
import { buildInvoicePDF, loadImageAsDataUrl } from "./buildInvoicePDF";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DownloadInvoiceButton({ invoice }: { invoice: any }) {
  const handleDownload = async () => {
    const invoiceNum  = invoice.invoice_number || `YSL-${invoice.id.slice(0, 8)}`;
    const freightAmt  = invoice.amount || 0;
    const advancePaid = invoice.trips?.advance_paid || 0;

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const createdAt = invoice.created_at ? new Date(invoice.created_at) : new Date();
    const dueAt     = (() => {
      if (invoice.due_date) return new Date(invoice.due_date);
      const d = new Date(createdAt);
      d.setDate(d.getDate() + 15);
      return d;
    })();

    // Load QR image (optional)
    let qrDataUrl: string | undefined;
    try {
      qrDataUrl = await loadImageAsDataUrl("/qr-code.png");
    } catch {
      // continue without QR
    }

    const doc = await buildInvoicePDF({
      invoiceNumber:   invoiceNum,
      invoiceDate:     fmt(createdAt),
      dueDate:         fmt(dueAt),
      partyName:       invoice.parties?.name    || "—",
      partyAddress:    invoice.parties?.address,
      partyGstin:      invoice.parties?.gstin,
      partyState:      invoice.parties?.state_code,
      vehicleNo:       invoice.trips?.vehicles?.registration_number,
      grNo:            invoice.trips?.gr_no       || undefined,
      grDate:          invoice.trips?.gr_date ? fmt(new Date(invoice.trips.gr_date)) : undefined,
      containerNo:     invoice.trips?.container_no || undefined,
      fromCity:        invoice.trips?.from_location,
      toCity:          invoice.trips?.to_location,
      freightAmount:   freightAmt,
      loadingCharges:  invoice.trips?.loading_charges ?? undefined,
      haltCharges:     invoice.trips?.halt_charges    ?? undefined,
      advanceReceived: advancePaid,
      weightString:    invoice.trips?.weight_kg ? `${invoice.trips.weight_kg} ${invoice.trips.weight_unit || "KG"}` : undefined,
      qrDataUrl,
    });

    doc.save(`${invoiceNum}.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-light hover:text-white transition-colors underline-offset-2 hover:underline"
    >
      <Download className="h-3.5 w-3.5" />
      Download PDF
    </button>
  );
}
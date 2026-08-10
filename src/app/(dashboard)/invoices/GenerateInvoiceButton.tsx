"use client";

import React, { useState } from "react";
import { Plus, FileText, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildInvoicePDF, loadImageAsDataUrl } from "./buildInvoicePDF";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GenerateInvoiceButton({ availableTrips }: { availableTrips: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGenerate = async (trip: any) => {
    setIsSubmitting(true);
    try {
      const now        = new Date();
      const invoiceNum = `YSL-INV-${now.getTime().toString().slice(-6)}`;
      const freightAmt  = trip.freight_amount || 0;
      const advancePaid = trip.advance_paid   || 0;
      const totalAmount = freightAmt; // transport invoices: no GST on GTA under RCM

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 15);

      // Persist invoice record
      const { error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNum,
          trip_id:        trip.id,
          party_id:       trip.party_id,
          org_id:         trip.org_id,
          amount:         freightAmt,
          total_amount:   totalAmount,
          status:         "unpaid",
          due_date:       dueDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Load QR image
      let qrDataUrl: string | undefined;
      try {
        qrDataUrl = await loadImageAsDataUrl("/qr-code.png");
      } catch {
        // QR image optional — continue without it
      }

      const today = now;
      const due   = dueDate;
      const fmt      = (d: Date) =>
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      const doc = await buildInvoicePDF({
        invoiceNumber:    invoiceNum,
        invoiceDate:      fmt(today),
        dueDate:          fmt(due),
        partyName:        trip.parties?.name || "—",
        partyAddress:     trip.parties?.address,
        partyGstin:       trip.parties?.gstin,
        partyState:       trip.parties?.state_code,
        vehicleNo:        trip.vehicles?.registration_number,
        grNo:             trip.gr_no             || undefined,
        grDate:           trip.gr_date ? fmt(new Date(trip.gr_date)) : undefined,
        containerNo:      trip.container_no      || undefined,
        fromCity:         trip.from_location,
        toCity:           trip.to_location,
        freightAmount:    freightAmt,
        loadingCharges:   trip.loading_charges   ?? undefined,
        haltCharges:      trip.halt_charges      ?? undefined,
        advanceReceived:  advancePaid,
        weightString:     trip.weight_kg ? `${trip.weight_kg} ${trip.weight_unit || "KG"}` : undefined,
        qrDataUrl,
      });

      doc.save(`${invoiceNum}.pdf`);
      toast.success("Invoice generated & downloaded!");
      setIsOpen(false);
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        {isSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Generate Invoice
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border bg-surface text-xs font-medium text-muted uppercase tracking-wider">
            Select Delivered Trip
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {availableTrips.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted">
                No delivered trips pending invoice.
              </div>
            ) : (
              availableTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleGenerate(trip)}
                  disabled={isSubmitting}
                  className="w-full text-left p-3 hover:bg-card-hover rounded-lg transition-colors flex items-start gap-3 disabled:opacity-50"
                >
                  <FileText className="h-5 w-5 text-primary-light shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      {trip.trip_number || `TRP-${trip.id.slice(-4).toUpperCase()}`}
                    </div>
                    <div className="text-xs text-muted-light mt-0.5">
                      {trip.parties?.name || "Unknown"} &bull;{" "}
                      {trip.from_location || "?"} → {trip.to_location || "?"}
                    </div>
                    <div className="text-xs text-muted-light mt-0.5">
                      {trip.vehicles?.registration_number || "No vehicle"}
                    </div>
                    <div className="text-xs font-semibold text-primary-light mt-0.5">
                      ₹{(trip.freight_amount || 0).toLocaleString("en-IN")}


                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
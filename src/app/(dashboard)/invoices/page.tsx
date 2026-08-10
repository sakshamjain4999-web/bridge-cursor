import React from "react";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GenerateInvoiceButton from "./GenerateInvoiceButton";
import DownloadInvoiceButton from "./DownloadInvoiceButton";

export default async function InvoicesPage() {
  const supabase = await createClient();

  // Fetch invoices — join trips(*) and parties(*) so every trip field is available for the PDF
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, trips(*, vehicles(*)), parties(*)")
    .order("created_at", { ascending: false });

  const invoiceList = invoices ?? [];

  // Fetch delivered trips for the Generate Invoice dropdown
  // Only pull the columns that definitely exist on the trips table
  const { data: deliveredTrips } = await supabase
    .from("trips")
    .select(
      "*, parties(*), vehicles(*)"
    )
    .eq("status", "delivered");

  const invoicedTripIds = new Set(invoiceList.map((inv) => inv.trip_id).filter(Boolean));
  const availableTrips = (deliveredTrips || []).filter((trip) => !invoicedTripIds.has(trip.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Invoice <span className="gradient-text">Management</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {invoiceList.length} invoice{invoiceList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <GenerateInvoiceButton availableTrips={availableTrips} />
      </div>

      {invoiceList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
            <FileText className="h-10 w-10 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Koi invoice nahi</h3>
          <p className="text-sm text-muted text-center max-w-sm mb-6">
            Parties ke liye invoices banao. GST billing yahan se manage hogi.
          </p>
          <GenerateInvoiceButton availableTrips={availableTrips} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                  <th className="px-6 py-3 text-left">Invoice Number</th>
                  <th className="px-6 py-3 text-left">Party Name</th>
                  <th className="px-6 py-3 text-left">Trip Number</th>
                  <th className="px-6 py-3 text-right">Amount (₹)</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Due Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {invoiceList.map((inv: any) => {
                  let badgeClass = "text-muted bg-muted/10";
                  if (inv.status === "paid") badgeClass = "text-green-500 bg-green-500/10";
                  if (inv.status === "partial") badgeClass = "text-yellow-500 bg-yellow-500/10";
                  if (inv.status === "unpaid") badgeClass = "text-red-500 bg-red-500/10";

                  const tripNum = inv.trips?.trip_number || (inv.trip_id ? `TRP-${inv.trip_id.slice(-4).toUpperCase()}` : "—");

                  return (
                    <tr key={inv.id} className="group hover:bg-card-hover transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-mono font-medium text-primary-light">
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-light">
                        {inv.parties?.name || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-mono text-muted-light">
                        {tripNum}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm font-semibold text-white">
                        ₹{inv.total_amount?.toLocaleString("en-IN") || "0"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                          {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-light">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <DownloadInvoiceButton invoice={inv} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
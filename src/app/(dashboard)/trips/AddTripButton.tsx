"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, X, Loader2, Route } from "lucide-react";

const initialForm = {
  from_location: "",
  to_location: "",
  freight_amount: "",
  advance_paid: "",
  freight_type: "",
  weight_kg: "",
  scheduled_date: "",
  gr_no: "",
  notes: "",
};

export default function AddTripButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_location || !form.to_location || !form.freight_amount) {
      toast.error("From, To, and Freight Amount are required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const fa = parseFloat(form.freight_amount) || 0;
    const ap = parseFloat(form.advance_paid) || 0;

    try {
      const { error } = await supabase.from("trips").insert([
        {
          from_location: form.from_location.trim().toLowerCase(),
          to_location: form.to_location.trim().toLowerCase(),
          freight_amount: fa,
          advance_paid: ap,
          balance_amount: fa - ap,
          payment_status: ap >= fa ? "paid" : ap > 0 ? "partial" : "pending",
          freight_type: form.freight_type.trim() || null,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          scheduled_date: form.scheduled_date || null,
          gr_no: form.gr_no.trim() || null,
          notes: form.notes.trim() || null,
          status: "pending",
          weight_unit: "KG",
          loading_charges: 0,
          halt_charges: 0,
        },
      ]);

      if (error) throw error;
      toast.success("Trip scheduled successfully!");
      handleClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule trip.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface py-2.5 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
      />
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
        New Trip
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-12"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 flex flex-col gap-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                  <Route className="h-4.5 w-4.5 text-primary-light" size={18} />
                </div>
                <h2 className="text-base font-bold text-foreground">Schedule New Trip</h2>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {field("from_location", "From *", "text", "e.g. Delhi")}
                {field("to_location", "To *", "text", "e.g. Mumbai")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("freight_amount", "Freight Amount (₹) *", "number", "e.g. 25000")}
                {field("advance_paid", "Advance Paid (₹)", "number", "e.g. 10000")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("freight_type", "Freight Type", "text", "e.g. FTL, Trailer")}
                {field("weight_kg", "Weight (KG)", "number", "e.g. 10000")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("scheduled_date", "Scheduled Date", "date")}
                {field("gr_no", "GR Number", "text", "e.g. 10653")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional remarks..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-surface py-2.5 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 transition-all"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

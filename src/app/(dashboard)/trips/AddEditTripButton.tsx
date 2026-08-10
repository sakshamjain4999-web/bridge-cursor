"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  X,
  Route,
  Loader2,
  CheckCircle,
  MapPin,
  Truck,
  Weight,
  Calendar,
  IndianRupee,
  FileText,
} from "lucide-react";

const initialForm = {
  party_id: "",
  from_location: "",
  to_location: "",
  vehicle_id: "",
  driver_id: "",
  driver_trip_charge: "",
  freight_type: "",
  weight_kg: "",
  weight_unit: "KG",
  freight_amount: "",
  advance_paid: "",
  scheduled_date: "",
  notes: "",
  // Invoice / transport fields
  gr_no: "",
  gr_date: "",
  container_no: "",
  loading_charges: "",
  halt_charges: "",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AddTripButton() {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        const raf = requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
        });
        return () => cancelAnimationFrame(raf);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Dropdown data
  const [parties, setParties] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    // Fetch parties
    supabase
      .from("parties")
      .select("id, name")
      .order("name")
      .then(({ data }) => setParties(data ?? []));

    // Fetch available vehicles
    supabase
      .from("vehicles")
      .select("id, registration_number")
      .eq("status", "available")
      .order("registration_number")
      .then(({ data }) => setVehicles(data ?? []));

    // Fetch available drivers (active only)
    supabase
      .from("drivers")
      .select("id, full_name, salary_type, salary_amount")
      .eq("status", "available")
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }) => setDrivers(data ?? []));
  }, [open]);

  const set = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const selectedDriver = drivers.find((d) => d.id === form.driver_id);
    const isPerTripDriver = selectedDriver?.salary_type === "per_trip";

    // 1. Insert trip
    const { error: insertErr } = await supabase.from("trips").insert({
      party_id:        form.party_id || null,
      vehicle_id:      form.vehicle_id || null,
      driver_id:       form.driver_id || null,
      from_location:   form.from_location.trim(),
      to_location:     form.to_location.trim(),
      freight_type:    form.freight_type.trim() || null,
      weight_kg:       form.weight_kg ? Number(form.weight_kg) : null,
      weight_unit:     form.weight_unit || "KG",
      freight_amount:  Number(form.freight_amount),
      advance_paid:    Number(form.advance_paid) || 0,
      scheduled_date:  form.scheduled_date || null,
      notes:           form.notes.trim() || null,
      status:          "pending",
      // Invoice fields
      gr_no:           form.gr_no.trim() || null,
      gr_date:         form.gr_date || null,
      container_no:    form.container_no.trim() || null,
      loading_charges: form.loading_charges ? Number(form.loading_charges) : 0,
      halt_charges:    form.halt_charges ? Number(form.halt_charges) : 0,
      driver_trip_charge: isPerTripDriver && form.driver_trip_charge ? Number(form.driver_trip_charge) : null,
    });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      toast.error("Error: " + insertErr.message);
      setLoading(false);
      return;
    }

    // 2. Update vehicle status to on_trip
    if (form.vehicle_id) {
      await supabase
        .from("vehicles")
        .update({ status: "on_trip" })
        .eq("id", form.vehicle_id);
    }

    // 3. Update driver status to on_trip
    if (form.driver_id) {
      await supabase
        .from("drivers")
        .update({ status: "on_trip" })
        .eq("id", form.driver_id);
    }

    // 4. Increment party total_business
    if (form.party_id && form.freight_amount) {
      await supabase.rpc("increment_party_business", {
        party_id: form.party_id,
        amount: Number(form.freight_amount),
        advance: Number(form.advance_paid) || 0,
      });
    }

    toast.success("Trip create ho gayi!");
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setForm(initialForm);
      setSuccess(false);
      router.refresh();
    }, 1200);
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

  const selectCls = `${inputCls} appearance-none`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        <Plus className="h-4 w-4" /> New Trip
      </button>

      {open && (
        <div
          ref={scrollRef}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 md:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setOpen(false);
              setError("");
            }
          }}
        >
          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Route className="h-5 w-5 text-primary-light" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    New Trip
                  </h2>
                  <p className="text-xs text-muted">
                    Naya trip create karo
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  !loading && (setOpen(false), setError(""))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-16 px-6 animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Trip create ho gayi!
                </h3>
                <p className="text-sm text-muted">
                  {form.from_location} → {form.to_location}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-6 space-y-5">
                {error && (
                  <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Party */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                    Party
                  </label>
                  <select
                    name="party_id"
                    value={form.party_id}
                    onChange={set}
                    className={selectCls}
                  >
                    <option value="">Select Party</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Route
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        From Location *
                      </label>
                      <input
                        name="from_location"
                        value={form.from_location}
                        onChange={set}
                        placeholder="Mumbai"
                        required
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        To Location *
                      </label>
                      <input
                        name="to_location"
                        value={form.to_location}
                        onChange={set}
                        placeholder="Delhi"
                        required
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle + Driver */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Assignment
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-muted">
                          Vehicle
                        </label>
                        <select
                          name="vehicle_id"
                          value={form.vehicle_id}
                          onChange={set}
                          className={selectCls}
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.registration_number}
                            </option>
                          ))}
                        </select>
                        {vehicles.length === 0 && (
                          <p className="text-[10px] text-warning">
                            Koi available vehicle nahi hai
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-muted">
                          Driver
                        </label>
                        <select
                          name="driver_id"
                          value={form.driver_id}
                          onChange={(e) => {
                            const dId = e.target.value;
                            const selectedD = drivers.find((d) => d.id === dId);
                            setForm((p) => ({
                              ...p,
                              driver_id: dId,
                              driver_trip_charge:
                                selectedD?.salary_type === "per_trip"
                                  ? (selectedD.salary_amount?.toString() || "0")
                                  : "",
                            }));
                          }}
                          className={selectCls}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.full_name}
                            </option>
                          ))}
                        </select>
                        {drivers.length === 0 && (
                          <p className="text-[10px] text-warning">
                            Koi available driver nahi hai
                          </p>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const selectedD = drivers.find((d) => d.id === form.driver_id);
                      if (selectedD?.salary_type === "per_trip") {
                        return (
                          <div className="grid grid-cols-2 gap-4 animate-fade-in">
                            <div />
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-muted">
                                Driver Trip Charge (₹) *
                              </label>
                              <input
                                name="driver_trip_charge"
                                type="number"
                                value={form.driver_trip_charge}
                                onChange={set}
                                required
                                placeholder="0"
                                className={inputCls}
                              />
                              <p className="text-[10px] text-muted">
                                Per Trip contractor rate for this specific trip
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Freight Details */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Weight className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Freight Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Freight Type
                      </label>
                      <input
                        name="freight_type"
                        value={form.freight_type}
                        onChange={set}
                        placeholder="Electronics, Textile..."
                        className={inputCls}
                      />
                    </div>
                     <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Weight
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          name="weight_kg"
                          type="number"
                          step="any"
                          value={form.weight_kg}
                          onChange={set}
                          placeholder={form.weight_unit === "Tons" ? "15" : "5000"}
                          className={`${inputCls} flex-1`}
                        />
                        <select
                          name="weight_unit"
                          value={form.weight_unit}
                          onChange={set}
                          className="w-24 shrink-0 rounded-xl border border-border bg-surface py-3 px-3 text-sm text-foreground focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none text-center"
                        >
                          <option value="KG">KG</option>
                          <option value="Tons">Tons</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Payment
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Freight Amount ₹ *
                      </label>
                      <input
                        name="freight_amount"
                        type="number"
                        value={form.freight_amount}
                        onChange={set}
                        placeholder="25000"
                        required
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Advance Paid ₹
                      </label>
                      <input
                        name="advance_paid"
                        type="number"
                        value={form.advance_paid}
                        onChange={set}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule + Notes */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Schedule & Notes
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Scheduled Date
                      </label>
                      <input
                        name="scheduled_date"
                        type="date"
                        value={form.scheduled_date}
                        onChange={set}
                        className={`${inputCls} scheme-dark`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={set}
                        placeholder="Koi special instruction..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice & Transport Details */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Invoice &amp; Transport Details
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted/60 mb-4">Optional — used to auto-fill the invoice PDF</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">GR Number</label>
                      <input
                        name="gr_no"
                        value={form.gr_no}
                        onChange={set}
                        placeholder="GR-001"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">GR Date</label>
                      <input
                        name="gr_date"
                        type="date"
                        value={form.gr_date}
                        onChange={set}
                        className={`${inputCls} scheme-dark`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="block text-xs font-medium text-muted">Container Number</label>
                    <input
                      name="container_no"
                      value={form.container_no}
                      onChange={set}
                      placeholder="CONT-XXXXXXXXXX"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Loading / Unloading Charges (Rs.)
                      </label>
                      <input
                        name="loading_charges"
                        type="number"
                        min="0"
                        value={form.loading_charges}
                        onChange={set}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-muted">
                        Halt / Detention Charges (Rs.)
                      </label>
                      <input
                        name="halt_charges"
                        type="number"
                        min="0"
                        value={form.halt_charges}
                        onChange={set}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                </div>

                {/* Submit */}
                <div className="border-t border-border p-6 bg-card rounded-b-2xl shrink-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Trip Create Karo
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
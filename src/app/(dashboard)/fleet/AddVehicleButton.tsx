"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, X, Truck, Loader2, CheckCircle, Calendar } from "lucide-react";

const VEHICLE_TYPES = [
    { value: "truck", label: "Truck" },
    { value: "trailer", label: "Trailer" },
    { value: "mini-truck", label: "Mini Truck" },
];

const DOC_FIELDS = [
    { name: "rc_expiry", label: "RC Expiry" },
    { name: "insurance_expiry", label: "Insurance Expiry" },
    { name: "permit_expiry", label: "Permit Expiry" },
    { name: "fitness_expiry", label: "Fitness Expiry" },
    { name: "pollution_expiry", label: "Pollution Certificate" },
    { name: "tax_expiry", label: "Tax Validity Expiry" },
    { name: "national_permit_expiry", label: "National Permit Expiry" },
    { name: "state_permit_expiry", label: "State Permit Expiry" },
];

const initialForm = {
    registration_number: "", make: "", model: "", capacity_kg: "",
    vehicle_type: "truck", rc_expiry: "", insurance_expiry: "",
    permit_expiry: "", fitness_expiry: "", pollution_expiry: "",
    tax_expiry: "", national_permit_expiry: "", state_permit_expiry: "",
};

export default function AddVehicleButton() {
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

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();

        // Direct insert — no org_id needed (RLS disabled for testing)
        const { error } = await supabase
            .from("vehicles")
            .insert({
                registration_number: form.registration_number,
                make: form.make,
                model: form.model,
                capacity_kg: Number(form.capacity_kg),
                vehicle_type: form.vehicle_type,
                rc_expiry: form.rc_expiry || null,
                insurance_expiry: form.insurance_expiry || null,
                permit_expiry: form.permit_expiry || null,
                fitness_expiry: form.fitness_expiry || null,
                pollution_expiry: form.pollution_expiry || null,
                tax_expiry: form.tax_expiry || null,
                national_permit_expiry: form.national_permit_expiry || null,
                state_permit_expiry: form.state_permit_expiry || null,
                status: "available",
            });

        if (error) {
            console.error("Insert error:", error);
            toast.error("Error: " + error.message);
            setLoading(false);
            return;
        }

        toast.success("Vehicle add ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => { setOpen(false); setForm(initialForm); setSuccess(false); router.refresh(); }, 1200);
    };

    const inputCls = "w-full rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    return (
        <>
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                <Plus className="h-4 w-4" /> Add Vehicle
            </button>

            {open && (
                <div
                    ref={scrollRef}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto grid place-items-start justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loading) {
                            setOpen(false);
                            setError("");
                        }
                    }}
                >
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                                    <Truck className="h-5 w-5 text-primary-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Add New Vehicle</h2>
                                    <p className="text-xs text-muted">Fleet mein naya vehicle add karo</p>
                                </div>
                            </div>
                            <button onClick={() => !loading && (setOpen(false), setError(""))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center py-16 px-6 animate-fade-in">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mb-4">
                                    <CheckCircle className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Vehicle add ho gaya!</h3>
                                <p className="text-sm text-muted">{form.registration_number.toUpperCase()} added.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <div className="p-6 space-y-5">
                                    {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">{error}</div>}

                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">Registration Number *</label>
                                        <input name="registration_number" value={form.registration_number} onChange={set} placeholder="MH-04-AB-1234" required className={`${inputCls} uppercase font-mono`} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">Make</label>
                                            <input name="make" value={form.make} onChange={set} placeholder="Tata" className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">Model</label>
                                            <input name="model" value={form.model} onChange={set} placeholder="407" className={inputCls} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">Capacity (kg)</label>
                                            <input name="capacity_kg" type="number" value={form.capacity_kg} onChange={set} placeholder="9000" className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">Vehicle Type</label>
                                            <select name="vehicle_type" value={form.vehicle_type} onChange={set} className={`${inputCls} appearance-none`}>
                                                {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar className="h-4 w-4 text-muted" />
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Document Expiry Dates</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {DOC_FIELDS.map((f) => (
                                                <div key={f.name} className="space-y-2">
                                                    <label className="block text-xs font-medium text-muted">{f.label}</label>
                                                    <input name={f.name} type="date" value={(form as Record<string, string>)[f.name]} onChange={set} className={`${inputCls} scheme-dark`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                <div className="border-t border-border p-6 bg-card rounded-b-2xl shrink-0">
                                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all">
                                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : <><Plus className="h-4 w-4" /> Vehicle Add Karo</>}
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
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Loader2, CheckCircle, Calendar } from "lucide-react";

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

const VEHICLE_TYPES = [
    { value: "truck", label: "Truck" },
    { value: "trailer", label: "Trailer" },
    { value: "mini-truck", label: "Mini Truck" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditVehicleForm({ vehicle }: { vehicle: any }) {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editing && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
            const raf = requestAnimationFrame(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [editing]);

    const [form, setForm] = useState({
        make: vehicle.make || "",
        model: vehicle.model || "",
        capacity: vehicle.capacity?.toString() || "",
        vehicle_type: vehicle.vehicle_type || "truck",
        rc_expiry: vehicle.rc_expiry || "",
        insurance_expiry: vehicle.insurance_expiry || "",
        permit_expiry: vehicle.permit_expiry || "",
        fitness_expiry: vehicle.fitness_expiry || "",
        pollution_expiry: vehicle.pollution_expiry || "",
        tax_expiry: vehicle.tax_expiry || "",
        national_permit_expiry: vehicle.national_permit_expiry || "",
        state_permit_expiry: vehicle.state_permit_expiry || "",
    });

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setLoading(true);
        setError("");
        const supabase = createClient();

        const { error: err } = await supabase
            .from("vehicles")
            .update({
                make: form.make.trim() || null,
                model: form.model.trim() || null,
                capacity: form.capacity ? Number(form.capacity) : null,
                vehicle_type: form.vehicle_type || null,
                rc_expiry: form.rc_expiry || null,
                insurance_expiry: form.insurance_expiry || null,
                permit_expiry: form.permit_expiry || null,
                fitness_expiry: form.fitness_expiry || null,
                pollution_expiry: form.pollution_expiry || null,
                tax_expiry: form.tax_expiry || null,
                national_permit_expiry: form.national_permit_expiry || null,
                state_permit_expiry: form.state_permit_expiry || null,
            })
            .eq("id", vehicle.id);

        if (err) { setError(err.message); setLoading(false); return; }
        setSuccess(true);
        setLoading(false);
        setTimeout(() => { setEditing(false); setSuccess(false); router.refresh(); }, 1000);
    };

    const inputCls = "w-full rounded-xl border border-border bg-surface py-2.5 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-muted-light hover:border-border-light hover:text-white transition-colors"
            >
                <Pencil className="h-4 w-4" /> Edit Vehicle Details
            </button>
        );
    }

    return (
        <div className="relative w-full flex flex-col max-h-[85vh] rounded-2xl border border-primary/30 bg-card animate-fade-in overflow-hidden mt-4">
            <h3 className="text-base font-semibold text-white px-6 pt-6 pb-4 border-b border-border/50 flex items-center gap-2 shrink-0">
                <Pencil className="h-4 w-4 text-primary-light" /> Edit Details
            </h3>

            {error && <div className="mx-6 mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shrink-0">{error}</div>}
            {success && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shrink-0">
                    <CheckCircle className="h-4 w-4" /> Updated successfully!
                </div>
            )}

            <div ref={scrollRef} className="overflow-y-auto pr-2 px-6 py-5 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Make</label>
                        <input name="make" value={form.make} onChange={set} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Model</label>
                        <input name="model" value={form.model} onChange={set} className={inputCls} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Capacity (kg)</label>
                        <input name="capacity" type="number" value={form.capacity} onChange={set} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Type</label>
                        <select name="vehicle_type" value={form.vehicle_type} onChange={set} className={`${inputCls} appearance-none`}>
                            {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Document Dates</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {DOC_FIELDS.map((f) => (
                            <div key={f.name} className="space-y-1.5">
                                <label className="text-xs font-medium text-muted">{f.label}</label>
                                <input name={f.name} type="date" value={(form as Record<string, string>)[f.name]} onChange={set} className={`${inputCls} scheme-dark`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-border px-6 py-4 bg-card rounded-b-2xl shrink-0 flex gap-3">
                <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60 transition-all">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-white transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
}
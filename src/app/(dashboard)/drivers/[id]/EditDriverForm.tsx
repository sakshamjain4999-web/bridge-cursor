"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Loader2, CheckCircle, Calendar, Banknote } from "lucide-react";

const SALARY_TYPES = [
    { value: "per_trip", label: "Per Trip" },
    { value: "monthly", label: "Monthly" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditDriverForm({ driver }: { driver: any }) {
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
        full_name: driver.full_name || "",
        phone: driver.phone || "",
        license_number: driver.license_number || "",
        license_expiry: driver.license_expiry || "",
        address: driver.address || "",
        emergency_contact: driver.emergency_contact || "",
        salary_type: driver.salary_type || "per_trip",
        salary_amount: driver.salary_amount?.toString() || "",
        status: driver.status || "available",
        is_active: driver.is_active !== false,
    });

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setLoading(true);
        setError("");
        const supabase = createClient();

        const { error: err } = await supabase
            .from("drivers")
            .update({
                full_name: form.full_name.trim(),
                phone: form.phone.trim() || null,
                license_number: form.license_number.trim() || null,
                license_expiry: form.license_expiry || null,
                address: form.address.trim() || null,
                emergency_contact: form.emergency_contact.trim() || null,
                salary_type: form.salary_type || null,
                salary_amount: form.salary_type === "per_trip" ? 0 : (form.salary_amount ? Number(form.salary_amount) : null),
                status: form.status,
                is_active: form.is_active,
            })
            .eq("id", driver.id);

        if (err) {
            setError(err.message);
            setLoading(false);
            return;
        }
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setEditing(false);
            setSuccess(false);
            router.refresh();
        }, 1000);
    };

    const inputCls =
        "w-full rounded-xl border border-border bg-surface py-2.5 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-muted-light hover:border-border-light hover:text-white transition-colors"
            >
                <Pencil className="h-4 w-4" /> Edit Driver Details
            </button>
        );
    }

    return (
        <div className="relative w-full flex flex-col max-h-[85vh] rounded-2xl border border-primary/30 bg-card animate-fade-in overflow-hidden mt-4">
            <h3 className="text-base font-semibold text-white px-6 pt-6 pb-4 border-b border-border/50 flex items-center gap-2 shrink-0">
                <Pencil className="h-4 w-4 text-primary-light" /> Edit Details
            </h3>

            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shrink-0">
                    {error}
                </div>
            )}
            {success && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shrink-0">
                    <CheckCircle className="h-4 w-4" /> Updated successfully!
                </div>
            )}

            <div ref={scrollRef} className="overflow-y-auto pr-2 px-6 py-5 space-y-4 flex-1">
                {/* Personal Details */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted">
                        Full Name *
                    </label>
                    <input
                        name="full_name"
                        value={form.full_name}
                        onChange={set}
                        required
                        className={inputCls}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">
                            Phone
                        </label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={set}
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">
                            Emergency Contact
                        </label>
                        <input
                            name="emergency_contact"
                            value={form.emergency_contact}
                            onChange={set}
                            className={inputCls}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted">
                        Address
                    </label>
                    <input
                        name="address"
                        value={form.address}
                        onChange={set}
                        className={inputCls}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted">
                            Status
                        </label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={set}
                            className={`${inputCls} appearance-none`}
                        >
                            <option value="available">Available</option>
                            <option value="on_trip">On Trip</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end pb-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))}
                                className="h-5 w-5 rounded-md border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                            />
                            <div>
                                <span className="text-sm font-semibold text-white">Active Status</span>
                                <p className="text-[10px] text-muted">Active / On Leave toggle</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* License Details */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                            License Details
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">
                                License Number
                            </label>
                            <input
                                name="license_number"
                                value={form.license_number}
                                onChange={set}
                                className={`${inputCls} font-mono uppercase`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">
                                License Expiry
                            </label>
                            <input
                                name="license_expiry"
                                type="date"
                                value={form.license_expiry}
                                onChange={set}
                                className={`${inputCls} scheme-dark`}
                            />
                        </div>
                    </div>
                </div>

                {/* Salary Details */}
                <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Banknote className="h-4 w-4 text-muted" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Salary Details
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">
                                Salary Type
                            </label>
                            <select
                                name="salary_type"
                                value={form.salary_type}
                                onChange={set}
                                className={`${inputCls} appearance-none`}
                            >
                                {SALARY_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">
                                Salary Amount (₹) {form.salary_type === "per_trip" ? "(Dynamic Payout)" : ""}
                            </label>
                            <input
                                name="salary_amount"
                                type="number"
                                value={form.salary_type === "per_trip" ? "" : form.salary_amount}
                                onChange={set}
                                disabled={form.salary_type === "per_trip"}
                                placeholder={form.salary_type === "per_trip" ? "Trip ke hisab se (Dynamic)" : "15000"}
                                className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                            {form.salary_type === "per_trip" && (
                                <p className="text-[10px] text-warning font-medium mt-1">
                                    ⚠️ Is driver ka payout har trip form mein alag se bhara jayega.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border px-6 py-4 bg-card rounded-b-2xl shrink-0 flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
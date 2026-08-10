"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Plus,
    X,
    Users,
    Loader2,
    CheckCircle,
    Banknote,
    UserPlus,
    AlertCircle,
    AlertTriangle,
} from "lucide-react";

const SALARY_TYPES = [
    { value: "per_trip", label: "Per Trip" },
    { value: "monthly", label: "Monthly" },
];

const initialForm = {
    full_name: "",
    phone: "",
    license_number: "",
    license_expiry: "",
    address: "",
    emergency_contact: "",
    salary_type: "per_trip",
    salary_amount: "",
};

export default function AddDriverButton() {
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
            .from("drivers")
            .insert({
                full_name: form.full_name.trim(),
                phone: form.phone.trim() || null,
                license_number: form.license_number.trim() || null,
                license_expiry: form.license_expiry || null,
                address: form.address.trim() || null,
                emergency_contact: form.emergency_contact.trim() || null,
                salary_type: form.salary_type || null,
                salary_amount: form.salary_type === "per_trip" ? 0 : (form.salary_amount ? Number(form.salary_amount) : null),
                status: "available",
            });

        if (error) {
            console.error("Insert error:", error);
            toast.error("Error: " + error.message);
            setLoading(false);
            return;
        }

        toast.success("Driver add ho gaya!");
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

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
                <Plus className="h-4 w-4" /> Add Driver
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
                    {/* Modal */}
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                                    <Users className="h-5 w-5 text-primary-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">
                                        Add New Driver
                                    </h2>
                                    <p className="text-xs text-muted">
                                        Team mein naya driver add karo
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
                                    Driver add ho gaya!
                                </h3>
                                <p className="text-sm text-muted">{form.full_name} added.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <div className="p-6 space-y-5">
                                    {error && (
                                        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                                            {error}
                                        </div>
                                    )}

                                    {/* === Personal Details === */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Full Name *
                                        </label>
                                        <input
                                            name="full_name"
                                            value={form.full_name}
                                            onChange={set}
                                            placeholder="Ramesh Kumar"
                                            required
                                            className={inputCls}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                                Phone *
                                            </label>
                                            <input
                                                name="phone"
                                                value={form.phone}
                                                onChange={set}
                                                placeholder="9876543210"
                                                required
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                                Emergency Contact
                                            </label>
                                            <input
                                                name="emergency_contact"
                                                value={form.emergency_contact}
                                                onChange={set}
                                                placeholder="9123456780"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Address
                                        </label>
                                        <input
                                            name="address"
                                            value={form.address}
                                            onChange={set}
                                            placeholder="Village / City, District, State"
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* === License Details === */}
                                    <div className="border-t border-border pt-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <UserPlus className="h-4 w-4 text-muted" />
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                                License Details
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-muted">
                                                    License Number
                                                </label>
                                                <input
                                                    name="license_number"
                                                    value={form.license_number}
                                                    onChange={set}
                                                    placeholder="DL-1234567890"
                                                    className={`${inputCls} font-mono uppercase`}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-muted">
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

                                        {/* License Expiry Warning Preview */}
                                        {(() => {
                                            if (!form.license_expiry) return null;
                                            const now = new Date();
                                            const expiry = new Date(form.license_expiry);
                                            const daysLeft = Math.ceil(
                                                (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                                            );
                                            if (daysLeft <= 0) {
                                                return (
                                                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger animate-fade-in">
                                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                        <span>
                                                            License <strong>expired</strong> — {Math.abs(daysLeft)} din pehle expire ho chuki hai!
                                                        </span>
                                                    </div>
                                                );
                                            } else if (daysLeft <= 30) {
                                                return (
                                                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning animate-fade-in">
                                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                        <span>
                                                            License <strong>{daysLeft} din</strong> mein expire ho rahi hai!
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* === Salary Details === */}
                                    <div className="border-t border-border pt-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Banknote className="h-4 w-4 text-muted" />
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                                Salary Details
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-muted">
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
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-muted">
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

                                {/* Submit */}
                                <div className="border-t border-border p-6 bg-card rounded-b-2xl shrink-0">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" /> Driver Add Karo
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
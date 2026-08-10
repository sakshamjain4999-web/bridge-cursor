"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Plus,
    X,
    Wallet,
    Loader2,
    CheckCircle,
    IndianRupee,
    Calendar,
    FileText,
    Truck,
} from "lucide-react";

const categories = [
    { value: "fuel", label: "Fuel" },
    { value: "toll", label: "Toll" },
    { value: "tyre", label: "Tyre" },
    { value: "repair", label: "Repair" },
    { value: "driver_advance", label: "Driver Advance" },
    { value: "other", label: "Other" },
];

interface Props {
    tripId: string;
    vehicleId?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AddTripExpenseButton({ tripId, vehicleId }: Props) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        category: "fuel",
        amount: "",
        description: "",
        vehicle_id: vehicleId ?? "",
        expense_date: new Date().toISOString().split("T")[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Fetch vehicles for dropdown (only if no vehicleId was pre-filled)
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        if (!open) return;
        const supabase = createClient();

        supabase
            .from("vehicles")
            .select("id, registration_number")
            .order("registration_number")
            .then(({ data }) => setVehicles(data ?? []));
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

        const { error: insertErr } = await supabase.from("expenses").insert({
            category: form.category,
            amount: Number(form.amount),
            description: form.description.trim() || null,
            vehicle_id: form.vehicle_id || null,
            trip_id: tripId,
            expense_date: form.expense_date,
        });

        if (insertErr) {
            console.error("Insert error:", insertErr);
            toast.error("Error: " + insertErr.message);
            setLoading(false);
            return;
        }

        toast.success("Expense add ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setOpen(false);
            router.refresh();
        }, 1200);
    };

    const inputCls =
        "w-full rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    const selectCls = `${inputCls} appearance-none`;

    return (
        <>
            <button
                onClick={() => {
                    setForm({
                        category: "fuel",
                        amount: "",
                        description: "",
                        vehicle_id: vehicleId ?? "",
                        expense_date: new Date().toISOString().split("T")[0],
                    });
                    setError("");
                    setSuccess(false);
                    setOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-light hover:border-primary/40 hover:text-white hover:bg-primary/10 transition-all"
            >
                <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !loading && setOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                                    <Wallet className="h-5 w-5 text-primary-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">
                                        Add Trip Expense
                                    </h2>
                                    <p className="text-xs text-muted">
                                        Is trip ka expense add karo
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => !loading && setOpen(false)}
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
                                    Expense add ho gaya!
                                </h3>
                                <p className="text-sm text-muted">
                                    {form.category} — ₹
                                    {Number(form.amount).toLocaleString("en-IN")}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {error && (
                                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                                        {error}
                                    </div>
                                )}

                                {/* Trip pre-filled indicator */}
                                <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
                                    <FileText className="h-4 w-4 text-primary-light" />
                                    <span className="text-xs text-primary-light font-medium">
                                        Trip automatically linked
                                    </span>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={set}
                                        required
                                        className={selectCls}
                                    >
                                        {categories.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <IndianRupee className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Amount
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-muted">
                                            Amount ₹ *
                                        </label>
                                        <input
                                            name="amount"
                                            type="number"
                                            value={form.amount}
                                            onChange={set}
                                            placeholder="1500"
                                            required
                                            min="1"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Details
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-muted">
                                            Description
                                        </label>
                                        <input
                                            name="description"
                                            value={form.description}
                                            onChange={set}
                                            placeholder="Diesel fill at pump, tyre repair etc."
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Vehicle */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Truck className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Vehicle
                                        </h4>
                                    </div>
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
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Date
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-muted">
                                            Expense Date
                                        </label>
                                        <input
                                            name="expense_date"
                                            type="date"
                                            value={form.expense_date}
                                            onChange={set}
                                            className={`${inputCls} scheme-dark`}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="border-t border-border pt-5">
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
                                                <Plus className="h-4 w-4" /> Expense Add Karo
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
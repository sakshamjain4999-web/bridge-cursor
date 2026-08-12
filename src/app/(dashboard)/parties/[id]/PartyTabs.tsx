"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Truck, CreditCard, Plus, X, Loader2, CheckCircle,
    IndianRupee, MapPin, Calendar, Pencil, Trash2, AlertTriangle,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAYMENT_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
];

const tripStatusConfig: Record<string, { label: string; cls: string }> = {
    booked: { label: "Booked", cls: "text-accent-light bg-accent/10" },
    dispatched: { label: "Dispatched", cls: "text-primary-light bg-primary/10" },
    in_transit: { label: "In Transit", cls: "text-warning bg-warning/10" },
    delivered: { label: "Delivered", cls: "text-success bg-success/10" },
    completed: { label: "Completed", cls: "text-success bg-success/10" },
    cancelled: { label: "Cancelled", cls: "text-danger bg-danger/10" },
};

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

interface PartyTabsProps {
    partyId: string;
    trips: any[];
    payments: any[];
}

const initialPayment = {
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
    payment_date: new Date().toISOString().split("T")[0],
};

export default function PartyTabs({ partyId, trips, payments }: PartyTabsProps) {
    const [tab, setTab] = useState<"trips" | "payments">("trips");
    const [payOpen, setPayOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [form, setForm] = useState(initialPayment);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const adjustPartyOutstanding = async (supabase: any, amountChange: number) => {
        const { error: updErr } = await supabase.rpc("decrement_outstanding", {
            p_party_id: partyId,
            p_amount: -amountChange,
        });

        if (updErr) {
            console.warn("RPC decrement_outstanding failed, falling back to manual update:", updErr);
            const { data: currentParty } = await supabase
                .from("parties")
                .select("outstanding_amount")
                .eq("id", partyId)
                .single();

            if (currentParty) {
                const newOutstanding = Math.max(
                    0,
                    (Number(currentParty.outstanding_amount) || 0) + amountChange
                );
                await supabase
                    .from("parties")
                    .update({ outstanding_amount: newOutstanding })
                    .eq("id", partyId);
            }
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const supabase = createClient();
        const amount = Number(form.amount);

        if (!amount || amount <= 0) {
            toast.error("Valid amount dalo");
            setLoading(false);
            return;
        }

        // Insert payment
        const { error: payErr } = await supabase.from("payments").insert({
            party_id: partyId,
            amount,
            payment_method: form.payment_method,
            reference_number: form.reference_number.trim() || null,
            notes: form.notes.trim() || null,
            payment_date: form.payment_date,
        });

        if (payErr) {
            toast.error("Error: " + payErr.message);
            setLoading(false);
            return;
        }

        // Update outstanding amount
        await adjustPartyOutstanding(supabase, -amount);

        toast.success("Payment record ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setPayOpen(false);
            setForm(initialPayment);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const handleEditPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();
        const amount = Number(form.amount);
        const oldAmount = Number(selectedPayment.amount) || 0;

        if (!amount || amount <= 0) {
            toast.error("Valid amount enter karein");
            setLoading(false);
            return;
        }

        // Update payment
        const { error: updateErr } = await supabase
            .from("payments")
            .update({
                amount,
                payment_method: form.payment_method,
                reference_number: form.reference_number.trim() || null,
                notes: form.notes.trim() || null,
                payment_date: form.payment_date,
            })
            .eq("id", selectedPayment.id);

        if (updateErr) {
            console.error("Update error:", updateErr);
            setError("Payment update failed: " + updateErr.message);
            setLoading(false);
            return;
        }

        // Adjust outstanding
        await adjustPartyOutstanding(supabase, oldAmount - amount);

        toast.success("Payment update ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setIsEditOpen(false);
            setSelectedPayment(null);
            setForm(initialPayment);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const handleDeletePayment = async () => {
        setError("");
        setLoading(true);

        const supabase = createClient();
        const amount = Number(selectedPayment.amount) || 0;

        // Delete payment
        const { error: deleteErr } = await supabase
            .from("payments")
            .delete()
            .eq("id", selectedPayment.id);

        if (deleteErr) {
            console.error("Delete error:", deleteErr);
            setError("Payment delete failed: " + deleteErr.message);
            setLoading(false);
            return;
        }

        // Revert outstanding
        await adjustPartyOutstanding(supabase, amount);

        toast.success("Payment delete ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setIsDeleteOpen(false);
            setSelectedPayment(null);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const openEditModal = (pay: any) => {
        setSelectedPayment(pay);
        setForm({
            amount: pay.amount?.toString() || "",
            payment_method: pay.payment_method || "cash",
            reference_number: pay.reference_number || "",
            notes: pay.notes || "",
            payment_date: pay.payment_date || pay.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        });
        setError("");
        setSuccess(false);
        setIsEditOpen(true);
    };

    const openDeleteModal = (pay: any) => {
        setSelectedPayment(pay);
        setError("");
        setSuccess(false);
        setIsDeleteOpen(true);
    };

    const inputCls =
        "w-full rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    return (
        <>
            {/* Tab Headers */}
            <div className="flex items-center gap-2 border-b border-border">
                <button
                    onClick={() => setTab("trips")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "trips"
                        ? "border-primary text-primary-light"
                        : "border-transparent text-muted hover:text-white"
                        }`}
                >
                    <Truck className="h-4 w-4" />
                    Trips ({trips.length})
                </button>
                <button
                    onClick={() => setTab("payments")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "payments"
                        ? "border-primary text-primary-light"
                        : "border-transparent text-muted hover:text-white"
                        }`}
                >
                    <CreditCard className="h-4 w-4" />
                    Payments ({payments.length})
                </button>
                <div className="flex-1" />
                {tab === "payments" && (
                    <button
                        onClick={() => setPayOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all mb-1"
                    >
                        <Plus className="h-3.5 w-3.5" /> Record Payment
                    </button>
                )}
            </div>

            {/* Trips Tab */}
            {tab === "trips" && (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {trips.length === 0 ? (
                        <div className="flex flex-col items-center py-14 px-6">
                            <Truck className="h-10 w-10 text-muted mb-3" />
                            <p className="text-sm text-muted">Koi trip nahi mili is party ke liye</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                        <th className="px-6 py-3 text-left">Route</th>
                                        <th className="px-6 py-3 text-left">Vehicle</th>
                                        <th className="px-6 py-3 text-left">Driver</th>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {trips.map((trip: any) => {
                                        const st = tripStatusConfig[trip.status] ?? { label: trip.status, cls: "text-muted bg-surface" };
                                        return (
                                            <tr key={trip.id} className="hover:bg-card-hover transition-colors">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-sm text-white">
                                                        <MapPin className="h-3.5 w-3.5 text-muted" />
                                                        {trip.from_location || "—"} → {trip.to_location || "—"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm font-mono text-muted-light">
                                                    {(trip.vehicles as any)?.registration_number || "—"}
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-muted-light">
                                                    {(trip.drivers as any)?.full_name || "—"}
                                                </td>
                                                <td className="px-6 py-3.5 text-sm text-muted-light">
                                                    {trip.created_at ? formatDate(trip.created_at) : "—"}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-sm font-semibold text-white">
                                                    {trip.freight_amount ? formatINR(trip.freight_amount) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Payments Tab */}
            {tab === "payments" && (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {payments.length === 0 ? (
                        <div className="flex flex-col items-center py-14 px-6">
                            <CreditCard className="h-10 w-10 text-muted mb-3" />
                            <p className="text-sm text-muted">Koi payment record nahi hai</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Method</th>
                                        <th className="px-6 py-3 text-left">Reference</th>
                                        <th className="px-6 py-3 text-left">Notes</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map((pay: any) => (
                                        <tr key={pay.id} className="hover:bg-card-hover transition-colors">
                                            <td className="px-6 py-3.5 text-sm text-muted-light">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-muted" />
                                                    {pay.payment_date
                                                        ? formatDate(pay.payment_date)
                                                        : pay.created_at
                                                            ? formatDate(pay.created_at)
                                                            : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="inline-flex rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted-light capitalize">
                                                    {pay.payment_method?.replace(/_/g, " ") || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm font-mono text-muted-light">
                                                {pay.reference_number || "—"}
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-muted-light max-w-[200px] truncate">
                                                {pay.notes || "—"}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                                                    <IndianRupee className="h-3 w-3" />
                                                    {formatINR(Number(pay.amount) || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(pay)}
                                                        title="Edit Payment"
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary/40 hover:text-primary-light hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(pay)}
                                                        title="Delete Payment"
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-danger/40 hover:text-danger hover:bg-danger/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Record Payment Modal */}
            {payOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setPayOpen(false)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                                    <CreditCard className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Record Payment</h2>
                                    <p className="text-xs text-muted">Payment details dalo</p>
                                </div>
                            </div>
                            <button onClick={() => !loading && setPayOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center py-16 px-6 animate-fade-in">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mb-4">
                                    <CheckCircle className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Payment recorded!</h3>
                            </div>
                        ) : (
                            <form onSubmit={handlePayment} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Amount (₹) *</label>
                                    <input name="amount" type="number" value={form.amount} onChange={set} placeholder="50000" required min="1" className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Payment Method</label>
                                    <select name="payment_method" value={form.payment_method} onChange={set} className={`${inputCls} appearance-none`}>
                                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Reference Number</label>
                                    <input name="reference_number" value={form.reference_number} onChange={set} placeholder="TXN123456" className={`${inputCls} font-mono`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Payment Date</label>
                                    <input name="payment_date" type="date" value={form.payment_date} onChange={set} required className={`${inputCls} scheme-dark`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Notes</label>
                                    <input name="notes" value={form.notes} onChange={set} placeholder="Partial payment for trip #42" className={inputCls} />
                                </div>
                                <div className="border-t border-border pt-5">
                                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-success to-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-success/25 hover:shadow-success/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all">
                                        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Recording...</>) : (<><CreditCard className="h-4 w-4" /> Record Payment</>)}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setIsEditOpen(false)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                                    <Pencil className="h-5 w-5 text-primary-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Edit Payment</h2>
                                    <p className="text-xs text-muted">Payment details modify karein</p>
                                </div>
                            </div>
                            <button onClick={() => !loading && setIsEditOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center py-16 px-6 animate-fade-in">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mb-4">
                                    <CheckCircle className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Payment updated!</h3>
                            </div>
                        ) : (
                            <form onSubmit={handleEditPayment} className="p-6 space-y-5">
                                {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Amount (₹) *</label>
                                    <input name="amount" type="number" value={form.amount} onChange={set} placeholder="50000" required min="1" className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Payment Method</label>
                                    <select name="payment_method" value={form.payment_method} onChange={set} className={`${inputCls} appearance-none`}>
                                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Reference Number</label>
                                    <input name="reference_number" value={form.reference_number} onChange={set} placeholder="TXN123456" className={`${inputCls} font-mono`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Payment Date</label>
                                    <input name="payment_date" type="date" value={form.payment_date} onChange={set} required className={`${inputCls} scheme-dark`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">Notes</label>
                                    <input name="notes" value={form.notes} onChange={set} placeholder="Partial payment details" className={inputCls} />
                                </div>
                                <div className="border-t border-border pt-5">
                                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all">
                                        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<><Pencil className="h-4 w-4" /> Save Changes</>)}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setIsDeleteOpen(false)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15">
                                    <AlertTriangle className="h-5 w-5 text-danger" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Delete Payment</h2>
                                    <p className="text-xs text-muted">Payment record delete karein</p>
                                </div>
                            </div>
                            <button onClick={() => !loading && setIsDeleteOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center py-16 px-6 animate-fade-in">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mb-4">
                                    <CheckCircle className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Payment deleted!</h3>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5">
                                {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>}
                                <p className="text-sm text-muted-light">
                                    Kya aap pakka is payment record ko delete karna chahte hain? Isse{" "}
                                    <strong className="text-white">{formatINR(Number(selectedPayment?.amount) || 0)}</strong> revert ho jayega aur party ka outstanding amount automatically increase ho jayega.
                                </p>
                                <div className="flex gap-3 border-t border-border pt-5">
                                    <button onClick={() => setIsDeleteOpen(false)} disabled={loading} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleDeletePayment} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger py-3 text-sm font-semibold text-white shadow-lg shadow-danger/25 hover:bg-red-600 hover:shadow-danger/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all">
                                        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : (<><Trash2 className="h-4 w-4" /> Delete</>)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
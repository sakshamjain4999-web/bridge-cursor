"use client";

import React, { useState, useEffect, useRef } from "react";
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
    Pencil,
    Trash2,
    AlertTriangle,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const EXPENSE_CATEGORIES = [
    { value: "fuel", label: "Fuel" },
    { value: "toll", label: "Toll" },
    { value: "tyre", label: "Tyre" },
    { value: "repair", label: "Repair" },
    { value: "driver_advance", label: "Driver Advance" },
    { value: "other", label: "Other" },
];

const categoryConfig: Record<
    string,
    { label: string; color: string; bg: string; dot: string }
> = {
    fuel: {
        label: "Fuel",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        dot: "bg-blue-400",
    },
    toll: {
        label: "Toll",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        dot: "bg-orange-400",
    },
    tyre: {
        label: "Tyre",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        dot: "bg-yellow-400",
    },
    repair: {
        label: "Repair",
        color: "text-red-400",
        bg: "bg-red-500/10",
        dot: "bg-red-400",
    },
    driver_advance: {
        label: "Driver Advance",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        dot: "bg-purple-400",
    },
    other: {
        label: "Other",
        color: "text-gray-400",
        bg: "bg-gray-500/10",
        dot: "bg-gray-400",
    },
};

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

interface TripExpensesProps {
    tripId: string;
    vehicleId?: string | null;
    expenses: any[];
}

export default function TripExpenses({
    tripId,
    vehicleId,
    expenses,
}: TripExpensesProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);

    const [form, setForm] = useState({
        category: "fuel",
        amount: "",
        description: "",
        vehicle_id: vehicleId ?? "",
        expense_date: new Date().toISOString().split("T")[0],
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const addScrollRef = useRef<HTMLDivElement>(null);
    const editScrollRef = useRef<HTMLDivElement>(null);

    const anyOpen = isAddOpen || isEditOpen || isDeleteOpen;

    useEffect(() => {
        if (anyOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [anyOpen]);

    useEffect(() => {
        if (isAddOpen && addScrollRef.current) {
            addScrollRef.current.scrollTop = 0;
            const raf = requestAnimationFrame(() => {
                if (addScrollRef.current) addScrollRef.current.scrollTop = 0;
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [isAddOpen]);

    useEffect(() => {
        if (isEditOpen && editScrollRef.current) {
            editScrollRef.current.scrollTop = 0;
            const raf = requestAnimationFrame(() => {
                if (editScrollRef.current) editScrollRef.current.scrollTop = 0;
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [isEditOpen]);

    // Fetch vehicles for dropdown (if user wants to assign)
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        if (!isAddOpen && !isEditOpen) return;
        const supabase = createClient();

        supabase
            .from("vehicles")
            .select("id, registration_number")
            .order("registration_number")
            .then(({ data }) => setVehicles(data ?? []));
    }, [isAddOpen, isEditOpen]);

    const set = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();
        const amount = Number(form.amount);

        if (!amount || amount <= 0) {
            toast.error("Valid amount enter karein");
            setLoading(false);
            return;
        }

        const { error: insertErr } = await supabase.from("expenses").insert({
            category: form.category,
            amount,
            description: form.description.trim() || null,
            vehicle_id: form.vehicle_id || null,
            trip_id: tripId,
            expense_date: form.expense_date,
        });

        if (insertErr) {
            console.error("Insert error:", insertErr);
            setError("Expense record nahi ho paya: " + insertErr.message);
            setLoading(false);
            return;
        }

        toast.success("Expense add ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setIsAddOpen(false);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const handleEditExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();
        const amount = Number(form.amount);

        if (!amount || amount <= 0) {
            toast.error("Valid amount enter karein");
            setLoading(false);
            return;
        }

        const { error: updateErr } = await supabase
            .from("expenses")
            .update({
                category: form.category,
                amount,
                description: form.description.trim() || null,
                vehicle_id: form.vehicle_id || null,
                expense_date: form.expense_date,
            })
            .eq("id", selectedExpense.id);

        if (updateErr) {
            console.error("Update error:", updateErr);
            setError("Expense update nahi ho paya: " + updateErr.message);
            setLoading(false);
            return;
        }

        toast.success("Expense update ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setIsEditOpen(false);
            setSelectedExpense(null);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const handleDeleteExpense = async () => {
        setError("");
        setLoading(true);

        const supabase = createClient();

        const { error: deleteErr } = await supabase
            .from("expenses")
            .delete()
            .eq("id", selectedExpense.id);

        if (deleteErr) {
            console.error("Delete error:", deleteErr);
            setError("Expense delete nahi ho paya: " + deleteErr.message);
            setLoading(false);
            return;
        }

        toast.success("Expense delete ho gaya!");
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            setIsDeleteOpen(false);
            setSelectedExpense(null);
            setSuccess(false);
            router.refresh();
        }, 1200);
    };

    const openAddModal = () => {
        setForm({
            category: "fuel",
            amount: "",
            description: "",
            vehicle_id: vehicleId ?? "",
            expense_date: new Date().toISOString().split("T")[0],
        });
        setError("");
        setSuccess(false);
        setIsAddOpen(true);
    };

    const openEditModal = (exp: any) => {
        setSelectedExpense(exp);
        setForm({
            category: exp.category || "fuel",
            amount: exp.amount?.toString() || "",
            description: exp.description || "",
            vehicle_id: exp.vehicle_id || "",
            expense_date: exp.expense_date || exp.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        });
        setError("");
        setSuccess(false);
        setIsEditOpen(true);
    };

    const openDeleteModal = (exp: any) => {
        setSelectedExpense(exp);
        setError("");
        setSuccess(false);
        setIsDeleteOpen(true);
    };

    const inputCls =
        "w-full rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:bg-surface-light focus:outline-none focus:ring-1 focus:ring-primary/50";

    const selectCls = `${inputCls} appearance-none`;

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                        Trip Expenses
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                        {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-light hover:border-primary/40 hover:text-white hover:bg-primary/10 transition-all"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Expense
                </button>
            </div>

            {/* Table Content */}
            {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface mb-4">
                        <Wallet className="h-7 w-7 text-muted" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                        Koi expense nahi
                    </h4>
                    <p className="text-xs text-muted text-center max-w-xs mb-4">
                        Is trip ka koi expense abhi record nahi hua. Add Expense button se add karo.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Category</th>
                                <th className="px-6 py-3 text-left">Description</th>
                                <th className="px-6 py-3 text-right">Amount (₹)</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {expenses.map((expense: any) => {
                                const cat =
                                    categoryConfig[expense.category] ?? categoryConfig["other"];
                                return (
                                    <tr
                                        key={expense.id}
                                        className="group hover:bg-card-hover transition-colors"
                                    >
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-muted-light">
                                                {expense.expense_date
                                                    ? formatDate(expense.expense_date)
                                                    : expense.created_at
                                                        ? formatDate(expense.created_at)
                                                        : "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${cat.color} ${cat.bg}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${cat.dot}`}
                                                />
                                                {cat.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-muted-light">
                                                {expense.description || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-sm font-semibold text-white">
                                                {expense.amount ? formatINR(expense.amount) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(expense)}
                                                    title="Edit Expense"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary/40 hover:text-primary-light hover:bg-primary/10 transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(expense)}
                                                    title="Delete Expense"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-danger/40 hover:text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Trip Expense Modal */}
            {isAddOpen && (
                <div
                    ref={addScrollRef}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto grid place-items-start justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loading) {
                            setIsAddOpen(false);
                        }
                    }}
                >
                    {/* Modal */}
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl shrink-0">
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
                                onClick={() => !loading && setIsAddOpen(false)}
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
                                    {form.category} — {formatINR(Number(form.amount))}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleAddExpense} className="flex flex-col">
                                <div className="p-6 space-y-5">
                                    {error && (
                                        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                                            {error}
                                        </div>
                                    )}

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
                                            {EXPENSE_CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Amount (₹) *
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

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Description
                                        </label>
                                        <input
                                            name="description"
                                            value={form.description}
                                            onChange={set}
                                            placeholder="Diesel fill, toll tax, driver food etc."
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* Vehicle */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
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

                                    {/* Date */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Expense Date
                                        </label>
                                        <input
                                            name="expense_date"
                                            type="date"
                                            value={form.expense_date}
                                            onChange={set}
                                            required
                                            className={`${inputCls} scheme-dark`}
                                        />
                                    </div>

                                </div>

                                {/* Submit */}
                                <div className="border-t border-border p-6 rounded-b-2xl">
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
                                                <Plus className="h-4 w-4" /> Add Expense
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Trip Expense Modal */}
            {isEditOpen && (
                <div
                    ref={editScrollRef}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto grid place-items-start justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loading) {
                            setIsEditOpen(false);
                        }
                    }}
                >
                    {/* Modal */}
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                                    <Pencil className="h-5 w-5 text-primary-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">
                                        Edit Trip Expense
                                    </h2>
                                    <p className="text-xs text-muted">Expense details modify karein</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !loading && setIsEditOpen(false)}
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
                                    Expense updated successfully!
                                </h3>
                                <p className="text-sm text-muted">
                                    {form.category} — {formatINR(Number(form.amount))}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleEditExpense} className="flex flex-col">
                                <div className="p-6 space-y-5">
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
                                            {EXPENSE_CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Amount (₹) *
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

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Description
                                        </label>
                                        <input
                                            name="description"
                                            value={form.description}
                                            onChange={set}
                                            placeholder="Diesel fill, toll tax, driver food etc."
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* Vehicle */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
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

                                    {/* Date */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Expense Date
                                        </label>
                                        <input
                                            name="expense_date"
                                            type="date"
                                            value={form.expense_date}
                                            onChange={set}
                                            required
                                            className={`${inputCls} scheme-dark`}
                                        />
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
                                                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto grid place-items-start justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loading) {
                            setIsDeleteOpen(false);
                        }
                    }}
                >
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col my-auto animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15">
                                    <AlertTriangle className="h-5 w-5 text-danger" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">
                                        Delete Expense
                                    </h2>
                                    <p className="text-xs text-muted">Expense details delete karein</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !loading && setIsDeleteOpen(false)}
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
                                    Expense deleted successfully!
                                </h3>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5">
                                {error && (
                                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                                        {error}
                                    </div>
                                )}

                                <p className="text-sm text-muted-light">
                                    Kya aap pakka is expense record ko delete karna chahte hain? Isse{" "}
                                    <strong className="text-white">
                                        {formatINR(Number(selectedExpense?.amount) || 0)}
                                    </strong>{" "}
                                    ({selectedExpense?.category}) permanent delete ho jayega.
                                </p>

                                <div className="flex gap-3 border-t border-border pt-5">
                                    <button
                                        onClick={() => setIsDeleteOpen(false)}
                                        disabled={loading}
                                        className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteExpense}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger py-3 text-sm font-semibold text-white shadow-lg shadow-danger/25 hover:bg-red-600 hover:shadow-danger/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
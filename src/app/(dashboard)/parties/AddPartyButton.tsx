"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Plus,
    X,
    Building2,
    Loader2,
    CheckCircle,
    Mail,
    MapPin,
} from "lucide-react";

const initialForm = {
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
};

export default function AddPartyButton() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const set = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.from("parties").insert({
            name: form.name.trim(),
            contact_name: form.contact_name.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            gst_number: form.gst_number.trim() || null,
            outstanding_amount: 0,
            total_business: 0,
        });

        if (error) {
            console.error("Insert error:", error);
            toast.error("Error: " + error.message);
            setLoading(false);
            return;
        }

        toast.success("Party add ho gayi!");
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
                <Plus className="h-4 w-4" /> Add Party
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !loading && (setOpen(false), setError(""))}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                                    <Building2 className="h-5 w-5 text-accent-light" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">
                                        Add New Party
                                    </h2>
                                    <p className="text-xs text-muted">
                                        Naya client / party add karo
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
                                    Party add ho gayi!
                                </h3>
                                <p className="text-sm text-muted">{form.name} added.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {error && (
                                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
                                        {error}
                                    </div>
                                )}

                                {/* Company / Party Name */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                        Company / Party Name *
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={set}
                                        placeholder="Sharma Transport Co."
                                        required
                                        className={inputCls}
                                    />
                                </div>

                                {/* Contact Person + Phone */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Contact Person
                                        </label>
                                        <input
                                            name="contact_name"
                                            value={form.contact_name}
                                            onChange={set}
                                            placeholder="Rajesh Sharma"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-muted">
                                            Phone
                                        </label>
                                        <input
                                            name="phone"
                                            value={form.phone}
                                            onChange={set}
                                            placeholder="9876543210"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Email + GST */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Mail className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Business Details
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-muted">
                                                Email
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={set}
                                                placeholder="info@sharma.co"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-muted">
                                                GST Number
                                            </label>
                                            <input
                                                name="gst_number"
                                                value={form.gst_number}
                                                onChange={set}
                                                placeholder="22AAAAA0000A1Z5"
                                                className={`${inputCls} font-mono uppercase`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="border-t border-border pt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin className="h-4 w-4 text-muted" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                            Address
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            name="address"
                                            value={form.address}
                                            onChange={set}
                                            placeholder="123 Industrial Area, Jaipur, Rajasthan"
                                            className={inputCls}
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
                                                <Plus className="h-4 w-4" /> Party Add Karo
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
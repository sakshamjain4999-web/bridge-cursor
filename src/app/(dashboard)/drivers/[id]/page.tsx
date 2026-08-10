import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Phone,
    CreditCard,
    Calendar,
    MapPin,
    Banknote,
    AlertCircle,
    AlertTriangle,
    Clock,
    UserCircle,
    PhoneCall,
} from "lucide-react";
import Link from "next/link";
import EditDriverForm from "./EditDriverForm";

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; dot: string }
> = {
    available: {
        label: "Available",
        color: "text-success",
        bg: "bg-success/10",
        dot: "bg-success",
    },
    on_trip: {
        label: "On Trip",
        color: "text-primary-light",
        bg: "bg-primary/10",
        dot: "bg-primary-light",
    },
    inactive: {
        label: "Inactive",
        color: "text-muted",
        bg: "bg-muted/10",
        dot: "bg-muted",
    },
};

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function DriverDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: driver, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !driver) return notFound();

    const status = driver.is_active === false
        ? {
            label: "On Leave",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            dot: "bg-orange-400",
        }
        : (statusConfig[driver.status] ?? statusConfig["available"]);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // License expiry calculations
    let licenseExpired = false;
    let licenseExpiringSoon = false;
    let licenseDaysLeft: number | null = null;
    let licenseColorCls = "text-muted";
    let licenseBgCls = "bg-surface";
    let licenseStatusText = "Not set";

    if (driver.license_expiry) {
        const expiry = new Date(driver.license_expiry);
        licenseDaysLeft = Math.ceil(
            (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (expiry <= now) {
            licenseExpired = true;
            licenseColorCls = "text-danger";
            licenseBgCls = "bg-danger/10";
            licenseStatusText = `Expired (${Math.abs(licenseDaysLeft)}d overdue)`;
        } else if (expiry <= thirtyDays) {
            licenseExpiringSoon = true;
            licenseColorCls = "text-warning";
            licenseBgCls = "bg-warning/10";
            licenseStatusText = `${licenseDaysLeft}d left`;
        } else {
            licenseColorCls = "text-success";
            licenseBgCls = "bg-success/10";
            licenseStatusText = `${licenseDaysLeft}d left`;
        }
    }

    // Check if on_trip — fetch current trip
    let currentTrip = null;
    if (driver.status === "on_trip") {
        const { data } = await supabase
            .from("trips")
            .select(
                "id, from_city, to_city, status, freight_amount, vehicles ( registration_number )"
            )
            .eq("driver_id", driver.id)
            .in("status", ["dispatched", "in_transit"])
            .limit(1)
            .single();
        currentTrip = data;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <Link
                href="/drivers"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Drivers
            </Link>

            {/* Driver Header */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 text-2xl font-bold text-primary-light">
                            {(driver.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {driver.full_name || "—"}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                {driver.phone && (
                                    <p className="flex items-center gap-1.5 text-sm text-muted">
                                        <Phone className="h-3.5 w-3.5" />
                                        {driver.phone}
                                    </p>
                                )}
                                {driver.address && (
                                    <p className="flex items-center gap-1.5 text-sm text-muted">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {driver.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${status.color} ${status.bg}`}
                    >
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Left: Details + Edit + Current Trip */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Driver Info Cards */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted" /> Driver Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {[
                                {
                                    label: "Full Name",
                                    value: driver.full_name || "—",
                                },
                                {
                                    label: "Phone",
                                    value: driver.phone || "—",
                                },
                                {
                                    label: "Emergency Contact",
                                    value: driver.emergency_contact || "—",
                                },
                                {
                                    label: "Address",
                                    value: driver.address || "—",
                                },
                                {
                                    label: "Salary",
                                    value: driver.salary_amount
                                        ? `${formatINR(Number(driver.salary_amount))} / ${driver.salary_type === "monthly" ? "month" : "trip"
                                        }`
                                        : "—",
                                },
                                {
                                    label: "Status",
                                    value: status.label,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-border bg-surface p-3"
                                >
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                                        {item.label}
                                    </p>
                                    <p className="text-sm font-semibold text-white capitalize">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Edit Form */}
                    <EditDriverForm driver={driver} />

                    {/* Current Trip */}
                    {currentTrip && (
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary-light" /> Current Trip
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted">Route: </span>
                                    <span className="text-white">
                                        {currentTrip.from_city} → {currentTrip.to_city}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted">Vehicle: </span>
                                    <span className="text-white font-mono">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {(currentTrip.vehicles as any)?.registration_number || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted">Amount: </span>
                                    <span className="text-white">
                                        ₹
                                        {currentTrip.freight_amount?.toLocaleString("en-IN") || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted">Status: </span>
                                    <span className="text-primary-light font-medium">
                                        {currentTrip.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: License & Documents */}
                <div className="space-y-6">
                    {/* License Info Card */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted" /> License Info
                        </h3>
                        <div className="space-y-3">
                            {/* License Number */}
                            <div className="rounded-xl border border-border bg-surface p-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                                    License Number
                                </p>
                                <p className="text-sm font-semibold text-white font-mono">
                                    {driver.license_number || "—"}
                                </p>
                            </div>

                            {/* License Expiry */}
                            <div
                                className={`flex items-center gap-3 rounded-xl border border-border p-3 ${licenseBgCls}`}
                            >
                                {licenseExpired ? (
                                    <AlertCircle
                                        className={`h-4 w-4 shrink-0 ${licenseColorCls}`}
                                    />
                                ) : licenseExpiringSoon ? (
                                    <AlertTriangle
                                        className={`h-4 w-4 shrink-0 ${licenseColorCls}`}
                                    />
                                ) : (
                                    <Calendar
                                        className={`h-4 w-4 shrink-0 ${licenseColorCls}`}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">
                                        License Expiry
                                    </p>
                                    <p className="text-xs text-muted">
                                        {driver.license_expiry
                                            ? new Date(driver.license_expiry).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                }
                                            )
                                            : "—"}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold ${licenseColorCls}`}>
                                    {licenseStatusText}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-muted" /> Contact
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                                <Phone className="h-4 w-4 text-muted shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                                        Phone
                                    </p>
                                    <p className="text-sm font-semibold text-white">
                                        {driver.phone || "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                                <PhoneCall className="h-4 w-4 text-muted shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                                        Emergency Contact
                                    </p>
                                    <p className="text-sm font-semibold text-white">
                                        {driver.emergency_contact || "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                                <MapPin className="h-4 w-4 text-muted shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                                        Address
                                    </p>
                                    <p className="text-sm font-semibold text-white">
                                        {driver.address || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salary Info */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted" /> Salary
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border bg-surface p-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                                    Type
                                </p>
                                <p className="text-sm font-semibold text-white capitalize">
                                    {driver.salary_type?.replace(/_/g, " ") || "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-surface p-3">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                                    Amount
                                </p>
                                <p className="text-sm font-semibold text-white">
                                    {driver.salary_amount
                                        ? formatINR(Number(driver.salary_amount))
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
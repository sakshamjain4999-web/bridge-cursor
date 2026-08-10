"use client";

import React from "react";
import Link from "next/link";
import {
    Phone,
    CreditCard,
    Calendar,
    AlertCircle,
    AlertTriangle,
    MapPin,
    Banknote,
    ChevronRight,
} from "lucide-react";

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

interface DriverCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    driver: any;
    licenseExpired: boolean;
    licenseExpiringSoon: boolean;
    licenseDaysLeft: number | null;
}

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function DriverCard({
    driver,
    licenseExpired,
    licenseExpiringSoon,
    licenseDaysLeft,
}: DriverCardProps) {
    const status = driver.is_active === false
        ? {
            label: "On Leave",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            dot: "bg-orange-400",
        }
        : (statusConfig[driver.status] ?? statusConfig["available"]);

    return (
        <Link href={`/drivers/${driver.id}`}>
            <div className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-border-light hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer ${driver.is_active === false ? "opacity-60" : ""}`}>
                {/* Gradient hover overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* License expiry indicator */}
                {(licenseExpired || licenseExpiringSoon) && (
                    <div className="absolute right-4 top-4">
                        {licenseExpired ? (
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/15 animate-pulse"
                                title="License expired"
                            >
                                <AlertCircle className="h-3.5 w-3.5 text-danger" />
                            </div>
                        ) : (
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 animate-pulse"
                                title="License expiring soon"
                            >
                                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            </div>
                        )}
                    </div>
                )}

                <div className="relative">
                    {/* Avatar + Name */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-accent/20 text-lg font-bold text-primary-light">
                            {(driver.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-white">
                                {driver.full_name || "—"}
                            </h3>
                            {driver.phone && (
                                <p className="flex items-center gap-1.5 text-sm text-muted mt-0.5">
                                    <Phone className="h-3 w-3" />
                                    {driver.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                        {driver.license_number && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-light">
                                <CreditCard className="h-3.5 w-3.5 text-muted" />
                                <span className="font-mono">{driver.license_number}</span>
                            </div>
                        )}
                        {driver.address && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-light">
                                <MapPin className="h-3.5 w-3.5 text-muted" />
                                <span className="truncate max-w-[140px]">{driver.address}</span>
                            </div>
                        )}
                    </div>

                    {/* License Expiry Row */}
                    {driver.license_expiry && (
                        <div className="mb-4">
                            <div
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${licenseExpired
                                    ? "text-danger bg-danger/10"
                                    : licenseExpiringSoon
                                        ? "text-warning bg-warning/10"
                                        : "text-muted-light bg-surface"
                                    }`}
                            >
                                <Calendar className="h-3 w-3" />
                                <span>
                                    License:{" "}
                                    {new Date(driver.license_expiry).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                                {licenseDaysLeft !== null && (
                                    <span className="ml-1 opacity-80">
                                        {licenseExpired
                                            ? `(${Math.abs(licenseDaysLeft)}d overdue)`
                                            : `(${licenseDaysLeft}d left)`}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Salary Row */}
                    {driver.salary_amount && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-light mb-4">
                            <Banknote className="h-3.5 w-3.5 text-muted" />
                            <span>
                                {formatINR(Number(driver.salary_amount))}
                                <span className="text-muted ml-1">
                                    / {driver.salary_type === "monthly" ? "month" : "trip"}
                                </span>
                            </span>
                        </div>
                    )}

                    {/* Footer: Status + Arrow */}
                    <div className="flex items-center justify-between">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${status.color} ${status.bg}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
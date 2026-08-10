"use client";

import React from "react";
import Link from "next/link";
import {
    Truck,
    Weight,
    AlertCircle,
    AlertTriangle,
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
    maintenance: {
        label: "Maintenance",
        color: "text-warning",
        bg: "bg-warning/10",
        dot: "bg-warning",
    },
};

interface VehicleCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vehicle: any;
    hasExpired: boolean;
    hasExpiringSoon: boolean;
}

export default function VehicleCard({
    vehicle,
    hasExpired,
    hasExpiringSoon,
}: VehicleCardProps) {
    const status = statusConfig[vehicle.status] ?? statusConfig["available"];

    return (
        <Link href={`/fleet/${vehicle.id}`}>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-border-light hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer">
                {/* Gradient hover overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Doc expiry indicator */}
                {(hasExpired || hasExpiringSoon) && (
                    <div className="absolute right-4 top-4">
                        {hasExpired ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/15" title="Document expired">
                                <AlertCircle className="h-3.5 w-3.5 text-danger" />
                            </div>
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15" title="Document expiring soon">
                                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            </div>
                        )}
                    </div>
                )}

                <div className="relative">
                    {/* Vehicle Icon + Registration */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-accent/20">
                            <Truck className="h-6 w-6 text-primary-light" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold font-mono tracking-wide text-white">
                                {vehicle.registration_number || "—"}
                            </h3>
                            <p className="text-sm text-muted mt-0.5">
                                {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-4 mb-4">
                        {vehicle.capacity_kg && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-light">
                                <Weight className="h-3.5 w-3.5 text-muted" />
                                <span>{Number(vehicle.capacity_kg).toLocaleString("en-IN")} kg</span>
                            </div>
                        )}
                        {vehicle.vehicle_type && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-light capitalize">
                                <span className="h-1 w-1 rounded-full bg-border-light" />
                                {vehicle.vehicle_type.replace(/-/g, " ")}
                            </div>
                        )}
                    </div>

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
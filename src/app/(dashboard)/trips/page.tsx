import React from "react";
import { MapPin, PackageX, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AddTripButton from "./AddTripButton";
import TripFilters from "./TripFilters";

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; dot: string }
> = {
    pending: {
        label: "Pending",
        color: "text-warning",
        bg: "bg-warning/10",
        dot: "bg-warning",
    },
    dispatched: {
        label: "Dispatched",
        color: "text-primary-light",
        bg: "bg-primary/10",
        dot: "bg-primary-light",
    },
    in_transit: {
        label: "In Transit",
        color: "text-accent-light",
        bg: "bg-accent/10",
        dot: "bg-accent-light",
    },
    delivered: {
        label: "Delivered",
        color: "text-success",
        bg: "bg-success/10",
        dot: "bg-success",
    },
    cancelled: {
        label: "Cancelled",
        color: "text-danger",
        bg: "bg-danger/10",
        dot: "bg-danger",
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

function generateTripNumber(id: string): string {
    // Use last 4 chars of uuid, uppercase
    const suffix = id.replace(/-/g, "").slice(-4).toUpperCase();
    return `TRP-${suffix}`;
}

export default async function TripsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const { status: filterStatus } = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from("trips")
        .select(
            `
      *,
      parties(name, phone),
      vehicles(registration_number),
      drivers(full_name, phone)
    `
        )
        .order("created_at", { ascending: false });

    if (filterStatus && filterStatus !== "all") {
        query = query.eq("status", filterStatus);
    }

    const { data: trips } = await query;
    const tripList = trips ?? [];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Trip <span className="gradient-text">Management</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {tripList.length} trip{tripList.length !== 1 ? "s" : ""} in your
                        records
                    </p>
                </div>
                <AddTripButton />
            </div>

            {/* Filter Buttons */}
            <TripFilters />

            {/* Trips Table or Empty State */}
            {tripList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
                        <PackageX className="h-10 w-10 text-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Koi trip nahi — New Trip banao
                    </h3>
                    <p className="text-sm text-muted text-center max-w-sm mb-6">
                        Abhi tak koi trip add nahi hui. Naya trip banao aur yahan dikhega.
                    </p>
                    <AddTripButton />
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                    <th className="px-6 py-3.5 text-left">Trip Number</th>
                                    <th className="px-6 py-3.5 text-left">Route</th>
                                    <th className="px-6 py-3.5 text-left">Party Name</th>
                                    <th className="px-6 py-3.5 text-left">Driver Name</th>
                                    <th className="px-6 py-3.5 text-left">Vehicle</th>
                                    <th className="px-6 py-3.5 text-left">Status</th>
                                    <th className="px-6 py-3.5 text-right">Freight (₹)</th>
                                    <th className="px-6 py-3.5 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {tripList.map((trip: any) => {
                                    const status =
                                        statusConfig[trip.status] ?? statusConfig["pending"];
                                    const partyName = trip.parties?.name ?? "—";
                                    const driverName = trip.drivers?.full_name ?? "—";
                                    const vehicleReg =
                                        trip.vehicles?.registration_number ?? "—";
                                    const tripNum = generateTripNumber(trip.id);

                                    return (
                                        <tr
                                            key={trip.id}
                                            className="group hover:bg-card-hover transition-colors"
                                        >
                                            {/* Trip Number */}
                                            <td className="px-6 py-3.5">
                                                <Link
                                                    href={`/trips/${trip.id}`}
                                                    className="text-sm font-mono font-semibold text-primary-light hover:text-accent-light transition-colors hover:underline underline-offset-2"
                                                >
                                                    {tripNum}
                                                </Link>
                                            </td>

                                            {/* Route */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                                                    <span className="text-sm text-foreground">
                                                        {trip.from_location || "—"}
                                                    </span>
                                                    <span className="text-xs text-muted">→</span>
                                                    <span className="text-sm text-foreground">
                                                        {trip.to_location || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Party Name */}
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm text-muted-light">
                                                    {partyName}
                                                </span>
                                            </td>

                                            {/* Driver Name */}
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm text-muted-light">
                                                    {driverName}
                                                </span>
                                            </td>

                                            {/* Vehicle */}
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm font-mono text-muted-light">
                                                    {vehicleReg}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${status.color} ${status.bg}`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                    />
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* Freight Amount */}
                                            <td className="px-6 py-3.5 text-right">
                                                <span className="text-sm font-semibold text-white">
                                                    {trip.freight_amount
                                                        ? formatINR(trip.freight_amount)
                                                        : "—"}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-1.5 text-sm text-muted-light">
                                                    <Calendar className="h-3.5 w-3.5 text-muted" />
                                                    {trip.created_at
                                                        ? formatDate(trip.created_at)
                                                        : "—"}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
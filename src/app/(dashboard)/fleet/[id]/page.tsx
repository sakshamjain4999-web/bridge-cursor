import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Truck, ArrowLeft, Calendar, Shield,
    FileText, CheckCircle, Clock,
} from "lucide-react";
import Link from "next/link";
import EditVehicleForm from "./EditVehicleForm";

const DOC_FIELDS = [
    { key: "rc_expiry", label: "RC Expiry", icon: FileText },
    { key: "insurance_expiry", label: "Insurance Expiry", icon: Shield },
    { key: "permit_expiry", label: "Permit Expiry", icon: FileText },
    { key: "fitness_expiry", label: "Fitness Expiry", icon: CheckCircle },
    { key: "pollution_expiry", label: "Pollution Certificate", icon: FileText },
    { key: "tax_expiry", label: "Tax Validity Expiry", icon: FileText },
    { key: "national_permit_expiry", label: "National Permit Expiry", icon: Shield },
    { key: "state_permit_expiry", label: "State Permit Expiry", icon: Shield },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    available: { label: "Available", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
    on_trip: { label: "On Trip", color: "text-primary-light", bg: "bg-primary/10", dot: "bg-primary-light" },
    maintenance: { label: "Maintenance", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
};

export default async function VehicleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: vehicle, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !vehicle) return notFound();

    const status = statusConfig[vehicle.status] ?? statusConfig["available"];
    const now = new Date();

    // Check if on_trip — fetch current trip
    let currentTrip = null;
    if (vehicle.status === "on_trip") {
        const { data } = await supabase
            .from("trips")
            .select("id, from_location, to_location, status, freight_amount, drivers(full_name)")
            .eq("vehicle_id", vehicle.id)
            .in("status", ["dispatched", "in_transit"])
            .limit(1)
            .single();
        currentTrip = data;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <Link href="/fleet" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Fleet
            </Link>

            {/* Vehicle Header */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-accent/20">
                            <Truck className="h-7 w-7 text-primary-light" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold font-mono tracking-wide text-white">
                                {vehicle.registration_number}
                            </h1>
                            <p className="text-sm text-muted mt-0.5">
                                {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle details"}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${status.color} ${status.bg}`}>
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Left: Details + Edit */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Vehicle Info */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white mb-4">Vehicle Details</h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {[
                                { label: "Make", value: vehicle.make || "—" },
                                { label: "Model", value: vehicle.model || "—" },
                                { label: "Type", value: vehicle.vehicle_type?.replace(/-/g, " ") || "—" },
                                { label: "Capacity", value: vehicle.capacity ? `${Number(vehicle.capacity).toLocaleString("en-IN")} kg` : "—" },
                                { label: "Status", value: status.label },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-border bg-surface p-3">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">{item.label}</p>
                                    <p className="text-sm font-semibold text-white capitalize">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Edit Form */}
                    <EditVehicleForm vehicle={vehicle} />

                    {/* Current Trip */}
                    {currentTrip && (
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary-light" /> Current Trip
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted">Route: </span><span className="text-white">{currentTrip.from_location} → {currentTrip.to_location}</span></div>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <div><span className="text-muted">Driver: </span><span className="text-white">{(currentTrip.drivers as any)?.full_name || "—"}</span></div>
                                <div><span className="text-muted">Amount: </span><span className="text-white">₹{currentTrip.freight_amount?.toLocaleString("en-IN") || "—"}</span></div>
                                <div><span className="text-muted">Status: </span><span className="text-primary-light font-medium">{currentTrip.status}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Documents */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted" /> Documents
                    </h3>
                    <div className="space-y-3">
                        {DOC_FIELDS.map((doc) => {
                            const dateStr = vehicle[doc.key];
                            const Icon = doc.icon;
                            let colorCls = "text-muted";
                            let bgCls = "bg-surface";
                            let statusText = "Not set";

                            if (dateStr) {
                                const expiry = new Date(dateStr);
                                const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                if (daysLeft <= 0) {
                                    colorCls = "text-danger"; bgCls = "bg-danger/10"; statusText = "Expired!";
                                } else if (daysLeft <= 30) {
                                    colorCls = "text-warning"; bgCls = "bg-warning/10"; statusText = `${daysLeft}d left`;
                                } else {
                                    colorCls = "text-success"; bgCls = "bg-success/10"; statusText = `${daysLeft}d left`;
                                }
                            }

                            return (
                                <div key={doc.key} className={`flex items-center gap-3 rounded-xl border border-border p-3 ${bgCls}`}>
                                    <Icon className={`h-4 w-4 shrink-0 ${colorCls}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{doc.label}</p>
                                        <p className="text-xs text-muted">
                                            {dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold ${colorCls}`}>{statusText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
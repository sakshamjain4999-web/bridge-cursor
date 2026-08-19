"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Truck, Navigation, PackageCheck, Ban } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TripActionsProps {
    trip: any;
}

export default function TripActions({ trip }: TripActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const updateStatus = async (newStatus: string) => {
        setLoading(true);
        const supabase = createClient();

        try {
            // Update trip status
            const { error } = await supabase
                .from("trips")
                .update({ status: newStatus })
                .eq("id", trip.id);

            if (error) throw error;

            // On "delivered" or "cancelled" — safely release vehicle and driver
            if (newStatus === "delivered" || newStatus === "cancelled") {
                if (trip.vehicle_id) {
                    await supabase
                        .from("vehicles")
                        .update({ status: "available" })
                        .eq("id", trip.vehicle_id)
                        .eq("status", "on_trip");
                }

                if (trip.driver_id) {
                    await supabase
                        .from("drivers")
                        .update({ status: "available" })
                        .eq("id", trip.driver_id)
                        .eq("status", "on_trip");
                }
            } else if (newStatus === "dispatched" || newStatus === "in_transit") {
                // Ensure assigned resources are on_trip
                if (trip.vehicle_id) {
                    await supabase
                        .from("vehicles")
                        .update({ status: "on_trip" })
                        .eq("id", trip.vehicle_id)
                        .eq("status", "available");
                }
                if (trip.driver_id) {
                    await supabase
                        .from("drivers")
                        .update({ status: "on_trip" })
                        .eq("id", trip.driver_id)
                        .eq("status", "available");
                }
            }

            const messages: Record<string, string> = {
                dispatched: "Trip dispatched ho gayi!",
                in_transit: "Trip ab transit mein hai!",
                delivered: "Trip delivered ho gayi! 🎉",
                cancelled: "Trip cancel ho gayi.",
            };

            toast.success(messages[newStatus] || "Status updated!");
            router.refresh();
        } catch (err: any) {
            toast.error("Error: " + (err.message || "Failed to update status"));
        } finally {
            setLoading(false);
        }
    };

    const status = trip.status;

    if (status === "delivered" || status === "cancelled") return null;

    return (
        <div className="flex items-center gap-3">
            {status === "pending" && (
                <button
                    onClick={() => updateStatus("dispatched")}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Truck className="h-4 w-4" />
                    )}
                    Mark Dispatched
                </button>
            )}

            {status === "dispatched" && (
                <button
                    onClick={() => updateStatus("in_transit")}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-accent to-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Navigation className="h-4 w-4" />
                    )}
                    Mark In Transit
                </button>
            )}

            {status === "in_transit" && (
                <button
                    onClick={() => updateStatus("delivered")}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-success to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/25 hover:shadow-success/40 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <PackageCheck className="h-4 w-4" />
                    )}
                    Mark Delivered
                </button>
            )}

            <button
                onClick={() => {
                    if (window.confirm("Kya aap sach mein is trip ko cancel karna chahte hain?")) {
                        updateStatus("cancelled");
                    }
                }}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                title="Cancel Trip"
            >
                <Ban className="h-3.5 w-3.5" />
                Cancel Trip
            </button>
        </div>
    );
}
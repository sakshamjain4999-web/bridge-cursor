"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Truck, Navigation, PackageCheck } from "lucide-react";

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

        // Update trip status
        const { error } = await supabase
            .from("trips")
            .update({ status: newStatus })
            .eq("id", trip.id);

        if (error) {
            toast.error("Error: " + error.message);
            setLoading(false);
            return;
        }

        // On "Mark Delivered" — release vehicle + driver + update party outstanding
        if (newStatus === "delivered") {
            if (trip.vehicle_id) {
                await supabase
                    .from("vehicles")
                    .update({ status: "available" })
                    .eq("id", trip.vehicle_id);
            }

            if (trip.driver_id) {
                await supabase
                    .from("drivers")
                    .update({ status: "available" })
                    .eq("id", trip.driver_id);
            }

            // Calculate balance and add to party outstanding
            const freightAmount = Number(trip.freight_amount) || 0;
            const advancePaid = Number(trip.advance_paid) || 0;
            const balanceAmount = freightAmount - advancePaid;

            if (trip.party_id && balanceAmount > 0) {
                await supabase.rpc("increment_party_business", {
                    party_id: trip.party_id,
                    amount: balanceAmount,
                });
            }
        }

        const messages: Record<string, string> = {
            dispatched: "Trip dispatched ho gayi!",
            in_transit: "Trip ab transit mein hai!",
            delivered: "Trip delivered ho gayi! 🎉",
        };

        toast.success(messages[newStatus] || "Status updated!");
        setLoading(false);
        router.refresh();
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
        </div>
    );
}
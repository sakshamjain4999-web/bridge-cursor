import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    ArrowLeft, Phone, MapPin, Building2, Mail,
    FileText, IndianRupee, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import PartyTabs from "./PartyTabs";
import PortalLinkCard from "./PortalLinkCard";

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function PartyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: party, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !party) return notFound();

    const outstanding = Number(party.outstanding_amount) || 0;
    const totalBusiness = Number(party.total_business) || 0;

    const { data: trips } = await supabase
        .from("trips")
        .select("id, from_location, to_location, status, freight_amount, created_at, vehicles ( registration_number ), drivers ( full_name )")
        .eq("party_id", id)
        .order("created_at", { ascending: false });

    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("party_id", id)
        .order("created_at", { ascending: false });

    const outCls = outstanding > 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <Link href="/parties" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Parties
            </Link>

            {/* Client Portal Link */}
            <PortalLinkCard
                portalToken={party.portal_token || ""}
                partyName={party.name || "Party"}
            />

            {/* Party Header */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-accent/20 to-primary/20 text-2xl font-bold text-accent-light">
                        {(party.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{party.name || "—"}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            {party.contact_name && <p className="flex items-center gap-1.5 text-sm text-muted"><Building2 className="h-3.5 w-3.5" />{party.contact_name}</p>}
                            {party.phone && <p className="flex items-center gap-1.5 text-sm text-muted"><Phone className="h-3.5 w-3.5" />{party.phone}</p>}
                            {party.email && <p className="flex items-center gap-1.5 text-sm text-muted"><Mail className="h-3.5 w-3.5" />{party.email}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            {party.gst_number && <p className="flex items-center gap-1.5 text-xs text-muted font-mono"><FileText className="h-3.5 w-3.5" />GST: {party.gst_number}</p>}
                            {party.address && <p className="flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5" />{party.address}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={`rounded-2xl border p-6 ${outCls ? "border-danger/30 bg-danger/5" : "border-success/30 bg-success/5"}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${outCls ? "bg-danger/15" : "bg-success/15"}`}>
                            <IndianRupee className={`h-5 w-5 ${outCls ? "text-danger" : "text-success"}`} />
                        </div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted">Outstanding Amount</p>
                    </div>
                    <p className={`text-3xl font-bold ${outCls ? "text-danger" : "text-success"}`}>{formatINR(outstanding)}</p>
                    <p className="text-xs text-muted mt-1">{outCls ? "Payment pending hai" : "Sab clear hai ✓"}</p>
                </div>

                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                            <TrendingUp className="h-5 w-5 text-primary-light" />
                        </div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Business Done</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-light">{formatINR(totalBusiness)}</p>
                    <p className="text-xs text-muted mt-1">Lifetime value</p>
                </div>
            </div>

            <PartyTabs partyId={id} trips={trips ?? []} payments={payments ?? []} />
        </div>
    );
}
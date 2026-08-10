import React from "react";
import { Building2, IndianRupee, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddPartyButton from "./AddPartyButton";
import Link from "next/link";

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function PartiesPage() {
    const supabase = await createClient();

    const { data: parties } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });

    const partyList = parties ?? [];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Party <span className="gradient-text">Management</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {partyList.length} part{partyList.length !== 1 ? "ies" : "y"}{" "}
                        registered
                    </p>
                </div>
                <AddPartyButton />
            </div>

            {/* Parties Table or Empty State */}
            {partyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
                        <Building2 className="h-10 w-10 text-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Koi party nahi — Add Party karo
                    </h3>
                    <p className="text-sm text-muted text-center max-w-sm mb-6">
                        Apne clients aur parties yahan add karo. Trip booking mein kaam
                        aayega.
                    </p>
                    <AddPartyButton />
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                    <th className="px-6 py-3.5 text-left">Party / Company</th>
                                    <th className="px-6 py-3.5 text-left">Contact Person</th>
                                    <th className="px-6 py-3.5 text-left">Phone</th>
                                    <th className="px-6 py-3.5 text-right">Outstanding</th>
                                    <th className="px-6 py-3.5 text-right">Total Business</th>
                                    <th className="px-6 py-3.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {partyList.map((party: any) => {
                                    const outstanding = Number(party.outstanding_amount) || 0;
                                    const totalBusiness = Number(party.total_business) || 0;
                                    const outstandingColor =
                                        outstanding > 0 ? "text-danger" : "text-success";

                                    return (
                                        <tr
                                            key={party.id}
                                            className="group hover:bg-card-hover transition-colors"
                                        >
                                            {/* Party / Company Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent/20 to-primary/20">
                                                        <Building2
                                                            className="h-4 w-4 text-accent-light"
                                                            strokeWidth={1.8}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-white">
                                                        {party.name || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contact Person */}
                                            <td className="px-6 py-4 text-sm text-muted-light">
                                                {party.contact_name || "—"}
                                            </td>

                                            {/* Phone */}
                                            <td className="px-6 py-4 text-sm text-muted-light font-mono">
                                                {party.phone || "—"}
                                            </td>

                                            {/* Outstanding Amount */}
                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-sm font-semibold ${outstandingColor}`}
                                                >
                                                    <IndianRupee className="h-3 w-3" />
                                                    {formatINR(outstanding)}
                                                </span>
                                            </td>

                                            {/* Total Business */}
                                            <td className="px-6 py-4 text-right text-sm font-semibold text-white">
                                                {formatINR(totalBusiness)}
                                            </td>

                                            {/* Ledger Action */}
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={`/parties/${party.id}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-light hover:bg-surface-light hover:text-white hover:border-border-light transition-all"
                                                >
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    Ledger
                                                </Link>
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
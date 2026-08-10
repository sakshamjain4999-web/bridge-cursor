"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "in_transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
];

export default function TripFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const current = searchParams.get("status") || "all";
    const [active, setActive] = useState(current);
    const [, startTransition] = useTransition();

    const handleFilter = (key: string) => {
        setActive(key);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (key === "all") {
                params.delete("status");
            } else {
                params.set("status", key);
            }
            router.push(`/trips?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
                <button
                    key={f.key}
                    onClick={() => handleFilter(f.key)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${active === f.key
                        ? "bg-primary/15 text-primary-light border border-primary/30"
                        : "bg-surface text-muted border border-border hover:bg-surface-light hover:text-muted-light"
                        }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
import React from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddDriverButton from "./AddDriverButton";
import DriverCard from "./DriverCard";

export default async function DriversPage() {
    const supabase = await createClient();

    // Fetch all drivers (RLS disabled for testing)
    const { data: drivers } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

    const driverList = drivers ?? [];

    // Compute license expiry status for each driver
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Driver <span className="gradient-text">Management</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {driverList.length} driver{driverList.length !== 1 ? "s" : ""}{" "}
                        registered
                    </p>
                </div>
                <AddDriverButton />
            </div>

            {/* Drivers Grid or Empty State */}
            {driverList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
                        <Users className="h-10 w-10 text-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Koi driver nahi
                    </h3>
                    <p className="text-sm text-muted text-center max-w-sm mb-6">
                        Apni team mein drivers add karo. Unki details aur trips yahan manage
                        hongi.
                    </p>
                    <AddDriverButton />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {driverList.map((driver: any) => {
                        let licenseExpired = false;
                        let licenseExpiringSoon = false;
                        let licenseDaysLeft: number | null = null;

                        if (driver.license_expiry) {
                            const expiry = new Date(driver.license_expiry);
                            licenseDaysLeft = Math.ceil(
                                (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                            );
                            if (expiry <= now) licenseExpired = true;
                            else if (expiry <= thirtyDaysFromNow) licenseExpiringSoon = true;
                        }

                        return (
                            <DriverCard
                                key={driver.id}
                                driver={driver}
                                licenseExpired={licenseExpired}
                                licenseExpiringSoon={licenseExpiringSoon}
                                licenseDaysLeft={licenseDaysLeft}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
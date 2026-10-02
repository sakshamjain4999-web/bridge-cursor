import React from "react";
import { Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddVehicleButton from "./AddVehicleButton";
import VehicleCard from "./VehicleCard";
import ExpiryBanner from "./ExpiryBanner";
import { elapsedSince, logPerformance, startPerformanceContext, startTimer } from "@/lib/performance-diagnostics";

// Document fields to check for expiry
const DOC_FIELDS = [
  { key: "rc_expiry", label: "RC" },
  { key: "insurance_expiry", label: "Insurance" },
  { key: "permit_expiry", label: "Permit" },
  { key: "fitness_expiry", label: "Fitness" },
  { key: "pollution_expiry", label: "Pollution Certificate" },
  { key: "tax_expiry", label: "Tax Validity" },
  { key: "national_permit_expiry", label: "National Permit" },
  { key: "state_permit_expiry", label: "State Permit" },
] as const;

export default async function FleetPage() {
  const perf = await startPerformanceContext("/fleet");
  const supabase = await createClient();

  // Fetch all vehicles (RLS disabled for testing)
  const vehiclesQueryStartedAt = startTimer();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  const vehiclesQueryDuration = elapsedSince(vehiclesQueryStartedAt);

  const vehicleList = vehicles ?? [];

  // Build expiry warnings
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  interface ExpiryWarning {
    vehicleReg: string;
    docLabel: string;
    expiryDate: Date;
    isExpired: boolean;
    daysLeft: number;
  }

  const expiryWarnings: ExpiryWarning[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vehicleList.forEach((v: any) => {
    DOC_FIELDS.forEach((doc) => {
      const dateStr = v[doc.key];
      if (!dateStr) return;
      const expiry = new Date(dateStr);
      if (expiry <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expiryWarnings.push({
          vehicleReg: v.registration_number,
          docLabel: doc.label,
          expiryDate: expiry,
          isExpired: daysLeft <= 0,
          daysLeft,
        });
      }
    });
  });

  // Sort: expired first, then by days left ascending
  expiryWarnings.sort((a, b) => a.daysLeft - b.daysLeft);

  const page = (
    <div className="space-y-6 animate-fade-in">
      {/* Expiry Alert Banners */}
      {expiryWarnings.length > 0 && (
        <ExpiryBanner warnings={expiryWarnings} />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Fleet <span className="gradient-text">Management</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {vehicleList.length} vehicle{vehicleList.length !== 1 ? "s" : ""}{" "}
            registered in your fleet
          </p>
        </div>
        <AddVehicleButton />
      </div>

      {/* Vehicle Grid or Empty State */}
      {vehicleList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
            <Truck className="h-10 w-10 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Koi vehicle nahi
          </h3>
          <p className="text-sm text-muted text-center max-w-sm mb-6">
            Apni fleet mein vehicles add karo. Registration, documents, aur
            sab kuch yahan manage hoga.
          </p>
          <AddVehicleButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {vehicleList.map((vehicle: any) => {
            // Calculate doc status for this vehicle
            let hasExpired = false;
            let hasExpiringSoon = false;

            DOC_FIELDS.forEach((doc) => {
              const dateStr = vehicle[doc.key];
              if (!dateStr) return;
              const expiry = new Date(dateStr);
              if (expiry <= now) hasExpired = true;
              else if (expiry <= thirtyDaysFromNow) hasExpiringSoon = true;
            });

            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                hasExpired={hasExpired}
                hasExpiringSoon={hasExpiringSoon}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  logPerformance(perf, [["Vehicles query", vehiclesQueryDuration]]);
  return page;
}

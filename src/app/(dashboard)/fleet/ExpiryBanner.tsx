"use client";

import React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";

export interface ExpiryWarning {
  vehicleId?: string;
  registrationNumber?: string;
  field?: string;
  label?: string;
  daysLeft: number;
  expired?: boolean;
}

interface ExpiryBannerProps {
  warnings: ExpiryWarning[];
}

export default function ExpiryBanner({ warnings }: ExpiryBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  const expired = warnings.filter((w) => w.expired ?? (w.daysLeft <= 0));
  const expiringSoon = warnings.filter((w) => !(w.expired ?? (w.daysLeft <= 0)));

  return (
    <div className="flex flex-col gap-3">
      {expired.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-danger mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-danger">
              {expired.length} document{expired.length > 1 ? "s" : ""} expired
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {expired.map((w, i) => (
                <span
                  key={i}
                  className="text-xs text-danger/80 bg-danger/10 border border-danger/20 rounded-lg px-2.5 py-0.5"
                >
                  {w.registrationNumber ? `${w.registrationNumber} — ` : ""}{w.label || "Document"} ({Math.abs(w.daysLeft)}d overdue)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning">
              {expiringSoon.length} document{expiringSoon.length > 1 ? "s" : ""} expiring soon
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {expiringSoon.map((w, i) => (
                <span
                  key={i}
                  className="text-xs text-warning/80 bg-warning/10 border border-warning/20 rounded-lg px-2.5 py-0.5"
                >
                  {w.registrationNumber ? `${w.registrationNumber} — ` : ""}{w.label || "Document"} ({w.daysLeft}d left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
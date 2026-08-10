import React from "react";
import {
  Wallet,
  Fuel,
  FileText,
  Wrench,
  ArrowUpRight,
  Route,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddExpenseButton from "./AddExpenseButton";

/* ── Category Config ── */
const categoryConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string; icon: React.ElementType }
> = {
  fuel: {
    label: "Fuel",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    icon: Fuel,
  },
  toll: {
    label: "Toll",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    icon: FileText,
  },
  tyre: {
    label: "Tyre",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-400",
    icon: Wrench,
  },
  repair: {
    label: "Repair",
    color: "text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    icon: Wrench,
  },
  driver_advance: {
    label: "Driver Advance",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    dot: "bg-purple-400",
    icon: Wallet,
  },
  other: {
    label: "Other",
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    dot: "bg-gray-400",
    icon: Wallet,
  },
};

/* ── Helpers ── */
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
  const suffix = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `TRP-${suffix}`;
}

/* ── Page ── */
export default async function ExpensesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, vehicles(registration_number), trips(trip_number)")
    .order("expense_date", { ascending: false });

  const expenseList = expenses ?? [];

  // Current month filter
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thisMonthExpenses = expenseList.filter((e: any) => {
    const d = new Date(e.expense_date || e.created_at);
    return d >= currentMonthStart;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalThisMonth = thisMonthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fuelTotal = thisMonthExpenses.filter((e: any) => e.category === "fuel").reduce((s: number, e: any) => s + (e.amount || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tollTotal = thisMonthExpenses.filter((e: any) => e.category === "toll").reduce((s: number, e: any) => s + (e.amount || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repairTotal = thisMonthExpenses.filter((e: any) => e.category === "repair").reduce((s: number, e: any) => s + (e.amount || 0), 0);

  const stats = [
    {
      label: "Total This Month",
      value: formatINR(totalThisMonth),
      subtitle: `${thisMonthExpenses.length} expenses`,
      icon: Wallet,
      color: "text-primary-light",
      bgColor: "bg-primary/10",
    },
    {
      label: "Fuel Expenses",
      value: formatINR(fuelTotal),
      subtitle: "Diesel / Petrol",
      icon: Fuel,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Toll Expenses",
      value: formatINR(tollTotal),
      subtitle: "Highway tolls",
      icon: FileText,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Repair Expenses",
      value: formatINR(repairTotal),
      subtitle: "Maintenance & repair",
      icon: Wrench,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Expense <span className="gradient-text">Tracker</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {expenseList.length} expense{expenseList.length !== 1 ? "s" : ""} •
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            Total: {formatINR(expenseList.reduce((s: number, e: any) => s + (e.amount || 0), 0))}
          </p>
        </div>
        <AddExpenseButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-border-light hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs font-medium text-muted">
                      {stat.subtitle}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}
                >
                  <Icon
                    className={`h-5 w-5 ${stat.color}`}
                    strokeWidth={1.8}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses Table or Empty State */}
      {expenseList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface mb-5">
            <Wallet className="h-10 w-10 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Koi expense nahi</h3>
          <p className="text-sm text-muted text-center max-w-sm mb-6">
            Fuel, toll, repair — sab expenses yahan track karo. Add Expense button se shuru karo.
          </p>
          <AddExpenseButton />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-left">Category</th>
                  <th className="px-6 py-3.5 text-left">Description</th>
                  <th className="px-6 py-3.5 text-left">Vehicle</th>
                  <th className="px-6 py-3.5 text-left">Trip</th>
                  <th className="px-6 py-3.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {expenseList.map((expense: any) => {
                  const cat = categoryConfig[expense.category] ?? categoryConfig["other"];
                  const vehicleReg = expense.vehicles?.registration_number ?? "—";
                  const tripNum = expense.trips?.trip_number
                    ? expense.trips.trip_number
                    : expense.trip_id
                      ? generateTripNumber(expense.trip_id)
                      : "—";

                  return (
                    <tr
                      key={expense.id}
                      className="group hover:bg-card-hover transition-colors"
                    >
                      {/* Date */}
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-muted-light">
                          {expense.expense_date
                            ? formatDate(expense.expense_date)
                            : expense.created_at
                              ? formatDate(expense.created_at)
                              : "—"}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${cat.color} ${cat.bg}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${cat.dot}`}
                          />
                          {cat.label}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-muted-light">
                          {expense.description || "—"}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-mono text-muted-light">
                          {vehicleReg}
                        </span>
                      </td>

                      {/* Trip */}
                      <td className="px-6 py-3.5">
                        {tripNum !== "—" ? (
                          <div className="flex items-center gap-1.5">
                            <Route className="h-3.5 w-3.5 text-muted" />
                            <span className="text-sm font-mono text-primary-light">
                              {tripNum}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-semibold text-white">
                          {expense.amount
                            ? formatINR(expense.amount)
                            : "—"}
                        </span>
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
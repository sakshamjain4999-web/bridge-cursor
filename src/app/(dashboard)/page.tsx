import React from "react";
import Link from "next/link";
import {
    Truck,
    Route,
    Users,
    IndianRupee,
    ArrowUpRight,
    MapPin,
    Clock,
    Fuel,
    AlertTriangle,
    PackageX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Format number to Indian currency style (e.g. 24,56,890)
function formatINR(amount: number): string {
    const formatted = amount.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
    return `₹${formatted}`;
}

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; dot: string }
> = {
    dispatched: {
        label: "Dispatched",
        color: "text-accent-light",
        bg: "bg-accent/10",
        dot: "bg-accent-light",
    },
    in_transit: {
        label: "In Transit",
        color: "text-primary-light",
        bg: "bg-primary/10",
        dot: "bg-primary-light",
    },
    delivered: {
        label: "Delivered",
        color: "text-success",
        bg: "bg-success/10",
        dot: "bg-success",
    },
    loading: {
        label: "Loading",
        color: "text-warning",
        bg: "bg-warning/10",
        dot: "bg-warning",
    },
    cancelled: {
        label: "Cancelled",
        color: "text-danger",
        bg: "bg-danger/10",
        dot: "bg-danger",
    },
};

interface QuickAction {
    label: string;
    href: string;
    icon: React.ElementType;
    color: string;
}

const quickActions: QuickAction[] = [
    { label: "New Trip", href: "/trips", icon: Route, color: "from-primary to-blue-700" },
    { label: "Add Vehicle", href: "/fleet", icon: Truck, color: "from-accent to-teal-700" },
    { label: "Fuel Entry", href: "/expenses", icon: Fuel, color: "from-warning to-amber-700" },
    { label: "View Alerts", href: "/fleet", icon: AlertTriangle, color: "from-danger to-red-700" },
];

export default async function DashboardPage() {
    const supabase = await createClient();

    // Step 1 - Get delivered trips:
    const { data: deliveredTrips } = await supabase
        .from('trips')
        .select('id, freight_amount')
        .eq('status', 'delivered')

    // Step 2 - Get expenses for those trips:
    const tripIds = (deliveredTrips || []).map(t => t.id)

    let totalExpenses = 0
    if (tripIds.length > 0) {
        const { data: expenseData } = await supabase
            .from('expenses')
            .select('amount')
            .in('trip_id', tripIds)

        totalExpenses = (expenseData || [])
            .reduce((sum, e) => sum + (e.amount || 0), 0)
    }

    // Step 3 - Calculate:
    const totalFreight = (deliveredTrips || [])
        .reduce((sum, t) => sum + (t.freight_amount || 0), 0)

    const netProfit = totalFreight - totalExpenses

    // Fetch all other stats in parallel
    const [activeTripsResult, fleetResult, recentTripsResult] =
        await Promise.all([
            // 2. Active Trips — count where status IN ('dispatched', 'in_transit')
            supabase
                .from("trips")
                .select("id", { count: "exact", head: true })
                .in("status", ["dispatched", "in_transit"]),

            // 3. Fleet Vehicles — total count
            supabase
                .from("vehicles")
                .select("id", { count: "exact", head: true }),

            // 4. Recent Trips — last 10 with joins
            supabase
                .from("trips")
                .select(
                    `
          id,
          from_location,
          to_location,
          freight_amount,
          status,
          created_at,
          parties ( name ),
          drivers ( full_name ),
          vehicles ( registration_number )
        `
                )
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

    const activeTripsCount = activeTripsResult.count ?? 0;
    const fleetCount = fleetResult.count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentTrips: any[] = recentTripsResult.data ?? [];

    // Build stats array with real data
    const stats = [
        {
            label: "Net Profit",
            value: formatINR(netProfit),
            subtitle: "After expenses",
            icon: IndianRupee,
            color: "text-success",
            bgColor: "bg-success/10",
        },
        {
            label: "Active Trips",
            value: activeTripsCount.toString(),
            subtitle: "Dispatched & In Transit",
            icon: Route,
            color: "text-primary-light",
            bgColor: "bg-primary/10",
        },
        {
            label: "Fleet Vehicles",
            value: fleetCount.toString(),
            subtitle: "Total registered",
            icon: Truck,
            color: "text-accent-light",
            bgColor: "bg-accent/10",
        },
        {
            label: "Active Drivers",
            value: "—",
            subtitle: "Coming soon",
            icon: Users,
            color: "text-warning",
            bgColor: "bg-warning/10",
        },
    ];

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {greeting}, <span className="gradient-text">Boss</span> 👋
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Here&apos;s what&apos;s happening with your fleet today
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                    <Clock className="h-4 w-4" />
                    <span>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
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

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-border-light hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
                        >
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${action.color} shadow-lg`}
                            >
                                <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                            </div>
                            <span className="text-sm font-semibold text-muted-light group-hover:text-white transition-colors">
                                {action.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Recent Trips Table */}
                <div className="xl:col-span-2 rounded-2xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                Recent Trips
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                                Latest trip activity across your fleet
                            </p>
                        </div>
                        <Link href="/trips" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-light hover:border-border-light hover:text-white transition-colors">
                            View All
                            <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentTrips.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface mb-4">
                                <PackageX className="h-8 w-8 text-muted" />
                            </div>
                            <h4 className="text-sm font-semibold text-white mb-1">
                                Koi trips nahi
                            </h4>
                            <p className="text-xs text-muted text-center max-w-xs">
                                Abhi tak koi trip add nahi hui. Naya trip banao aur yahan
                                dikhega.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted">
                                        <th className="px-6 py-3 text-left">Trip ID</th>
                                        <th className="px-6 py-3 text-left">Route</th>
                                        <th className="px-6 py-3 text-left">Driver</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {recentTrips.map((trip: any) => {
                                        const status =
                                            statusConfig[trip.status] ?? statusConfig["loading"];
                                        const partyName = trip.parties?.name ?? "—";
                                        const driverName = trip.drivers?.full_name ?? "—";
                                        const vehicleReg =
                                            trip.vehicles?.registration_number ?? "—";

                                        return (
                                            <tr
                                                key={trip.id}
                                                className="group hover:bg-card-hover transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-3.5">
                                                    <span className="text-sm font-mono font-medium text-primary-light">
                                                        #{trip.id.toString().slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5 text-muted" />
                                                        <span className="text-sm text-foreground">
                                                            {trip.from_location || "—"}
                                                        </span>
                                                        <span className="text-xs text-muted">→</span>
                                                        <span className="text-sm text-foreground">
                                                            {trip.to_location || "—"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-muted ml-5.5">
                                                        {vehicleReg} · {partyName}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className="text-sm text-muted-light">
                                                        {driverName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${status.color} ${status.bg}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                        />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <span className="text-sm font-semibold text-white">
                                                        {trip.freight_amount
                                                            ? formatINR(trip.freight_amount)
                                                            : "—"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Panel: Fleet Status */}
                <div className="space-y-6">
                    {/* Fleet Overview */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="text-base font-semibold text-white">Fleet Status</h3>
                        <p className="text-xs text-muted mt-0.5 mb-5">
                            {fleetCount} total vehicles registered
                        </p>

                        {fleetCount === 0 ? (
                            <div className="flex flex-col items-center py-6">
                                <Truck className="h-8 w-8 text-muted mb-2" />
                                <p className="text-xs text-muted">Koi vehicle nahi mili</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[
                                    {
                                        label: "Registered",
                                        count: fleetCount,
                                        total: fleetCount,
                                        color: "bg-primary",
                                    },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="text-muted-light">{item.label}</span>
                                            <span className="font-semibold text-white">
                                                {item.count}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                                            <div
                                                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                                style={{
                                                    width: `${(item.count / item.total) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Alerts */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-white">Alerts</h3>
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-muted/15 px-1.5 text-[10px] font-bold text-muted">
                                0
                            </span>
                        </div>

                        <div className="flex flex-col items-center py-6">
                            <AlertTriangle className="h-8 w-8 text-muted mb-2" />
                            <p className="text-xs text-muted">Koi alert nahi — sab sahi hai</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
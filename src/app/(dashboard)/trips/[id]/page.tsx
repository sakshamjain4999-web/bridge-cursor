"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import TripActions from "./TripActions";

interface Trip {
  id: string;
  trip_number: string;
  from_location: string;
  to_location: string;
  status: string;
  freight_amount: number;
  advance_paid: number;
  balance_amount: number;
  payment_status: string;
  freight_type: string;
  weight_kg: number | null;
  scheduled_date: string;
  gr_no: string;
  notes: string;
  vehicle_id: string | null;
  driver_id: string | null;
  org_id: string | null;
  party_id: string | null;
  vehicles?: { registration_number: string; make: string; model: string } | null;
  drivers?: { full_name: string; phone: string } | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
}

function statusStyle(status: string) {
  switch (status) {
    case "delivered": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "dispatched": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "in_transit": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    case "cancelled": return "bg-red-500/10 text-red-400 border border-red-500/20";
    default: return "bg-zinc-800 text-zinc-400 border border-zinc-700";
  }
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "payments">("overview");

  // Add expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState("");
  const [savingExp, setSavingExp] = useState(false);

  // Add payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tripRes, expRes, payRes] = await Promise.all([
        supabase
          .from("trips")
          .select(`*, vehicles(registration_number, make, model), drivers(full_name, phone)`)
          .eq("id", tripId)
          .single(),
        supabase.from("expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false }),
        supabase.from("payments").select("*").eq("trip_id", tripId).order("payment_date", { ascending: false }),
      ]);
      if (tripRes.data) setTrip(tripRes.data as Trip);
      setExpenses((expRes.data || []) as Expense[]);
      setPayments((payRes.data || []) as Payment[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);



  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCategory || !expAmount) return;
    setSavingExp(true);
    try {
      const { error } = await supabase.from("expenses").insert([{
        trip_id: tripId,
        vehicle_id: trip?.vehicle_id || null,
        category: expCategory,
        amount: parseFloat(expAmount),
        description: expDesc,
        expense_date: expDate || new Date().toISOString().split("T")[0],
        org_id: trip?.org_id || null,
      }]);
      if (error) throw error;
      toast.success("Expense added");
      setExpCategory(""); setExpAmount(""); setExpDesc(""); setExpDate("");
      setShowExpenseForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add expense");
    } finally {
      setSavingExp(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    setSavingPay(true);
    try {
      const pa = parseFloat(payAmount);
      const { error } = await supabase.from("payments").insert([{
        trip_id: tripId,
        party_id: trip?.party_id || null,
        invoice_id: null,
        amount: pa,
        payment_method: payMode,
        payment_date: payDate || new Date().toISOString().split("T")[0],
        org_id: trip?.org_id || null,
      }]);
      if (error) throw error;
      // Update trip balance
      if (trip) {
        const newAdvance = (trip.advance_paid || 0) + pa;
        const newBalance = (trip.freight_amount || 0) - newAdvance;
        await supabase.from("trips").update({
          advance_paid: newAdvance,
          balance_amount: newBalance < 0 ? 0 : newBalance,
          payment_status: newBalance <= 0 ? "paid" : newAdvance > 0 ? "partial" : "pending",
        }).eq("id", tripId);
      }
      toast.success("Payment recorded");
      setPayAmount(""); setPayDate(""); setPayMode("cash"); setPayNotes("");
      setShowPaymentForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSavingPay(false);
    }
  };

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <p className="text-xl font-bold text-white">Trip not found</p>
        <button onClick={() => router.back()} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-white">
              {trip.from_location} → {trip.to_location}
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">GR: {trip.gr_no || "—"} · {trip.trip_number || tripId.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TripActions trip={trip} />
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle(trip.status)}`}>
            {trip.status}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-5 border-b border-zinc-800/60">
        {(["overview", "expenses", "payments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-xl text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-zinc-900 border border-b-transparent border-zinc-800 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-6 flex flex-col gap-6">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Freight</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">₹{(trip.freight_amount || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Advance Paid</p>
                <p className="text-xl font-extrabold text-amber-400 mt-1">₹{(trip.advance_paid || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Balance</p>
                <p className="text-xl font-extrabold text-red-400 mt-1">₹{(trip.balance_amount || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "Vehicle", value: trip.vehicles?.registration_number?.toUpperCase() || "Unassigned" },
                { label: "Driver", value: trip.drivers?.full_name || "Unassigned" },
                { label: "Freight Type", value: trip.freight_type || "—" },
                { label: "Weight (KG)", value: trip.weight_kg ? `${trip.weight_kg.toLocaleString("en-IN")} KG` : "—" },
                { label: "Scheduled Date", value: trip.scheduled_date ? new Date(trip.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                { label: "Payment Status", value: trip.payment_status || "pending" },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{field.label}</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {trip.notes && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Notes</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{trip.notes}</p>
              </div>
            )}

          </>
        )}

        {/* EXPENSES TAB */}
        {activeTab === "expenses" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Expenses</p>
                <p className="text-2xl font-extrabold text-red-400">₹{totalExpenses.toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Category *</label>
                    <input value={expCategory} onChange={(e) => setExpCategory(e.target.value)} placeholder="e.g. Fuel, Toll" required className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Amount (₹) *</label>
                    <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0" required min="0" className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Description</label>
                    <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Optional details" className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Date</label>
                    <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-zinc-200 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingExp} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60">
                    {savingExp && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    Save Expense
                  </button>
                </div>
              </form>
            )}

            {expenses.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl">No expenses recorded for this trip.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{exp.category}</p>
                      {exp.description && <p className="text-xs text-zinc-500 mt-0.5">{exp.description}</p>}
                      {exp.expense_date && <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(exp.expense_date).toLocaleDateString("en-IN")}</p>}
                    </div>
                    <p className="text-base font-extrabold text-red-400">₹{(exp.amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Collected</p>
                <p className="text-2xl font-extrabold text-emerald-400">₹{totalPayments.toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Record Payment
              </button>
            </div>

            {showPaymentForm && (
              <form onSubmit={handleAddPayment} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Amount (₹) *</label>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" required min="0" className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Date</label>
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Payment Mode</label>
                    <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Notes</label>
                    <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-zinc-200 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingPay} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60">
                    {savingPay && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    Save Payment
                  </button>
                </div>
              </form>
            )}

            {payments.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl">No payments recorded for this trip.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {payments.map((pay) => (
                  <div key={pay.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-200 capitalize">{pay.payment_method?.replace("_", " ") || "Cash"}</p>
                      {pay.payment_date && <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(pay.payment_date).toLocaleDateString("en-IN")}</p>}
                    </div>
                    <p className="text-base font-extrabold text-emerald-400">₹{(pay.amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

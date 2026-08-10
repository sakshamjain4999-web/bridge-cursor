"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Bridge AI Transport");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Settings saved");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-20 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md px-6 py-4">
        <h1 className="text-lg font-bold text-white">Settings</h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Company Configuration</p>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        <form onSubmit={handleSave} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-white">Company Information</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: "Company Name", value: companyName, set: setCompanyName, placeholder: "e.g. Bridge Transport Co." },
              { label: "GSTIN", value: gstin, set: setGstin, placeholder: "22AAAAA0000A1Z5" },
              { label: "Phone", value: phone, set: setPhone, placeholder: "9876543210" },
              { label: "Email", value: email, set: setEmail, placeholder: "info@company.com" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Full company address" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 transition-all shadow-md">
              {saving && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              Save Settings
            </button>
          </div>
        </form>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-white">Application Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Version</p><p className="text-zinc-200 font-mono mt-0.5">1.0.0</p></div>
            <div><p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Stack</p><p className="text-zinc-200 mt-0.5">Next.js · Supabase</p></div>
          </div>
        </div>
      </main>
    </div>
  );
}

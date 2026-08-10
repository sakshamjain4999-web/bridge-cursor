"use client";

import React, { useState } from "react";
import { Copy, Check, MessageCircle, ExternalLink } from "lucide-react";

export default function PortalLinkCard({ portalToken, partyName }: { portalToken: string; partyName: string }) {
    const [copied, setCopied] = useState(false);

    const portalUrl = `https://bridge-cursor.vercel.app/portal/${portalToken}`;
    const waMessage = encodeURIComponent(
        `Namaste! Aapka shipment track karein:\n${portalUrl}`
    );
    const waUrl = `https://wa.me/?text=${waMessage}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(portalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback for older browsers
            const el = document.createElement("textarea");
            el.value = portalUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!portalToken) {
        return (
            <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">
                    No portal link yet. Add a{" "}
                    <code className="font-mono text-primary-light">portal_token</code> to
                    this party in Supabase to enable the client portal.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                    <ExternalLink className="h-4 w-4 text-primary-light" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">Client Portal Link</p>
                    <p className="text-xs text-muted">Share with {partyName} to let them track shipments</p>
                </div>
            </div>

            {/* URL display */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 mb-3">
                <span className="flex-1 truncate text-xs font-mono text-primary-light select-all">
                    {portalUrl}
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
                {/* Copy */}
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${copied
                        ? "bg-success/20 text-success border border-success/30"
                        : "bg-primary/20 text-primary-light border border-primary/30 hover:bg-primary/30"
                        }`}
                >
                    {copied ? (
                        <><Check className="h-4 w-4" /> Copied!</>
                    ) : (
                        <><Copy className="h-4 w-4" /> Copy Link</>
                    )}
                </button>

                {/* WhatsApp */}
                <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                >
                    <MessageCircle className="h-4 w-4" />
                    Share on WhatsApp
                </a>
            </div>
        </div>
    );
}
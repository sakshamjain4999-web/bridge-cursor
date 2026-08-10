import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="ml-[260px] flex min-h-screen flex-col transition-all duration-300">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>

            {/* Toast Notifications */}
            <Toaster
                theme="dark"
                position="top-right"
                richColors
                toastOptions={{
                    style: {
                        background: "#111827",
                        border: "1px solid rgba(255,255,255,0.08)",
                    },
                }}
            />
        </>
    );
}
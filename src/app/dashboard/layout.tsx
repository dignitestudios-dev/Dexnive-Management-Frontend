"use client";

import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { Header } from "@/components/layout/header/header";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next-nprogress-bar";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect route via effect to avoid throwing NEXT_REDIRECT in a client component render
  useEffect(() => {
    if (mounted && isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [mounted, isInitialized, isAuthenticated, router]);

  // Prevent flash of content during hydration or auth check
  if (!mounted || !isInitialized) {
    return <div className="h-screen w-full bg-white flex items-center justify-center" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        
        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
          {children}
        </main>
      </div>
    </div>
  );
}

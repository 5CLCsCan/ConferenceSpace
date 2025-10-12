"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChairDashboard from "@/components/chair/chair-dashboard";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/lib/auth-context";

export default function ChairPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (
      user &&
      !user.roles.includes("chair") &&
      !user.roles.includes("pc_member")
    ) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role="chair" />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ChairDashboard />
        </Suspense>
      </main>
    </div>
  );
}

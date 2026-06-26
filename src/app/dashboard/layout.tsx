import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { BottomNav } from "@/components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="hidden md:block">
        <DashboardNav />
      </div>
      {children}
      <BottomNav />
    </div>
  );
}

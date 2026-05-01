import BottomNav from "@/components/layout/BottomNav";
import DesktopSidebar from "@/components/layout/DesktopSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <DesktopSidebar />
      <main className="h-full overflow-y-auto lg:ml-60">{children}</main>
      <BottomNav />
    </div>
  );
}

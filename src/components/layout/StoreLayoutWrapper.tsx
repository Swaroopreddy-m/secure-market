"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AIChat from "@/components/ui/AIChat";

export default function StoreLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Hide storefront layout elements on standalone login page (/) and all dashboards (/admin/*)
  const hideLayout = pathname === "/" || pathname.startsWith("/admin");

  if (hideLayout) {
    return <main className="flex-1 flex flex-col min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col min-h-screen">
        {children}
      </main>
      <Footer />
      <AIChat />
    </>
  );
}

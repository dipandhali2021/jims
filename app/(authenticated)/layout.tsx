"use client"

import { ReactNode, useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { DashboardSidebar } from "@/components/Sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useClerk } from "@clerk/nextjs"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // You can fetch the user's role from your auth provider
  // For now, we'll assume the user is an admin
  const { user } = useClerk();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close sidebar when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Navbar isMobileOpen={isMobileOpen} toggleMobileMenu={toggleMobileMenu} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <SidebarProvider>
          <DashboardSidebar
            isAdmin={isAdmin}
            isMobileOpen={isMobileOpen}
            toggleMobileMenu={toggleMobileMenu}
          />
          <SidebarInset className="bg-background">
            <main className="flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  )
}


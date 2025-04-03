"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  History, 
  PieChart, 
  Users, 
  Settings, 
  ChevronDown, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type SidebarLink = {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  subItems?: { href: string; label: string }[]
}

interface DashboardSidebarProps {
  isAdmin?: boolean
  user?: any
  isMobileOpen: boolean
  toggleMobileMenu: () => void
}

const sidebarLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  // { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href:"/sales", label: "Sales", icon: ShoppingBag },
  { href: "/requests", label: "Requests", icon: History },
  { href: "/analytics", label: "Analytics", icon: PieChart, adminOnly: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    subItems: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/account", label: "Account" },
      { href: "/settings/notifications", label: "Notifications" },
    ],
  },
]

export function DashboardSidebar({ isAdmin = true, user, isMobileOpen, toggleMobileMenu }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()


  const filteredLinks = sidebarLinks.filter((link) => !link.adminOnly || (link.adminOnly && isAdmin))


  // For desktop view - regular sidebar
  const desktopSidebar = (
    <div className="hidden md:block h-full">
      <Sidebar className="h-full border-r bg-background">
        <SidebarHeader className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LayoutDashboard className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-lg">Jewelry Admin</span>
                    <span className="text-xs opacity-70">Management Dashboard</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {user && (
          <div className="px-4 py-2 border-b mb-2">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user.imageUrl} alt="User avatar" />
                <AvatarFallback>
                  {user.firstName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.fullName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          </div>
        )}

        <SidebarContent className="p-4">
          <SidebarMenu>
            {filteredLinks.map((link) => (
              <SidebarMenuItem key={link.label}>
                {link.subItems ? (
                  <>
                    <SidebarMenuButton className="justify-between hover:bg-accent/50">
                      <div className="flex items-center">
                        <link.icon className="mr-3 h-5 w-5" />
                        <span>{link.label}</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {link.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={pathname === subItem.href}
                            className="hover:bg-accent/50 pl-10"
                          >
                            <Link href={subItem.href}>
                              {subItem.label}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === link.href}
                    className="hover:bg-accent/50"
                  >
                    <Link href={link.href}>
                      <link.icon className="mr-3 h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="mt-auto">
          <div className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => signOut()}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="p-4 text-xs text-muted-foreground">
              <p>© 2024 Jewelry Admin</p>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )

  // Full screen mobile sidebar
  const mobileSidebar = (
    <div className={`
      fixed inset-0 bg-white z-50 md:hidden
      transform transition-transform duration-300 ease-in-out
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">Jewelry Admin</span>
              <span className="text-xs opacity-70">Management Dashboard</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* User profile */}
        {user && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.imageUrl} alt="User avatar" />
                <AvatarFallback>
                  {user.firstName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.fullName}</span>
                <span className="text-sm text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1 px-2">
            {filteredLinks.map((link) => (
              <div key={link.label} className="mb-1">
                {link.subItems ? (
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-left font-normal h-12"
                    >
                      <div className="flex items-center">
                        <link.icon className="mr-3 h-5 w-5" />
                        <span>{link.label}</span>
                      </div>
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    <div className="pl-10 space-y-1">
                      {link.subItems.map((subItem) => (
                        <Button
                          key={subItem.label}
                          variant="ghost"
                          className={`w-full justify-start text-left font-normal h-11 ${
                            pathname === subItem.href ? 'bg-accent text-accent-foreground' : ''
                          }`}
                          asChild
                        >
                          <Link 
                            href={subItem.href}
                            onClick={toggleMobileMenu}
                          >
                            {subItem.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left font-normal h-12 ${
                      pathname === link.href ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    asChild
                  >
                    <Link 
                      href={link.href} 
                      onClick={toggleMobileMenu}
                    >
                      <link.icon className="mr-3 h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with logout */}
        <div className="border-t mt-auto">
          <div className="p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left font-normal h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut()}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Log out</span>
            </Button>
          </div>
          <div className="p-4 text-xs text-muted-foreground">
            <p>© 2024 Jewelry Admin</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Render both sidebars */}
      {desktopSidebar}
      {mobileSidebar}
    </>
  )
}
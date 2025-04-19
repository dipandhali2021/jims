'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useNotificationCount } from '@/components/NotificationCount';
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
  X,
  Sparkles,
  Bell,
  HelpCircle,
  Search,
  Gem,
} from 'lucide-react';

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
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export type SidebarLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  shopkeeperOnly?: boolean;
  subItems?: { href: string; label: string }[];
  badge?: string;
};

interface DashboardSidebarProps {
  isAdmin?: boolean;
  isShopkeeper?: boolean;
  user?: any;
  isMobileOpen: boolean;
  toggleMobileMenu: () => void;
}

const sidebarLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/requests', label: 'Sales Requests', icon: History },
  { href: '/product-requests', label: 'Product Requests', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    subItems: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/account', label: 'Account' },
      { href: '/settings/notifications', label: 'Notifications' },
    ],
  },
];

export function DashboardSidebar({
  isAdmin = false,
  isShopkeeper = false,
  user,
  isMobileOpen,
  toggleMobileMenu,
}: DashboardSidebarProps) {
  const unreadCount = useNotificationCount();
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLinks = sidebarLinks.filter(
    (link) =>
      (!link.adminOnly || (link.adminOnly && isAdmin)) &&
      (!link.shopkeeperOnly || (link.shopkeeperOnly && isShopkeeper))
  );

  // For desktop view - regular sidebar
  const desktopSidebar = (
    <div className="hidden md:block h-full">
      <Sidebar className="h-full border-r bg-gradient-to-b from-background to-background/95 backdrop-blur-sm">
        <SidebarHeader className="p-4 ">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-full" asChild>
                <Link href="/dashboard">
                  <div className="flex aspect-square size-11 items-center justify-center rounded-full bg-yellow-100 border border-yellow-200 shadow-sm">
                    <Gem className="size-6 text-yellow-600" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-lg tracking-tight">
                      JEWELRY INVENTORY
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAdmin ? 'Admin' : 'Shopkeeper'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {user && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="border-2 border-primary/10 ring-2 ring-background">
                <AvatarImage src={user.imageUrl} alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
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
            <div className="mt-3 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 bg-muted/50 border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <SidebarContent className="px-2 py-4">
          <div className="mb-2 px-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          <SidebarMenu>
            {filteredLinks.map((link) => (
              <SidebarMenuItem key={link.label}>
                {link.subItems ? (
                  <>
                    <SidebarMenuButton className="justify-between group hover:bg-accent/50 rounded-md">
                      <div className="flex items-center">
                        <div
                          className={`mr-3 p-2 rounded-md ${
                            pathname.startsWith(link.href)
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/50 text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <link.icon className="h-4 w-4" />
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </SidebarMenuButton>
                    <SidebarMenuSub className="ml-10 mt-1">
                      {link.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.href}
                            className="hover:bg-accent/50 py-2 px-4 rounded-md text-sm"
                          >
                            <Link href={subItem.href}>{subItem.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === link.href}
                    className="hover:bg-accent/50 rounded-md group"
                  >
                    <Link href={link.href}>
                      <div
                        className={`mr-3 p-2 rounded-md ${
                          pathname === link.href
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/50 text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                      </div>
                      <span>{link.label}</span>
                      {link.badge && (
                        <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                          {link.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="mt-auto border-t px-4 py-4">
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full justify-start border-dashed text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Log out</span>
          </Button>
          <div className="mt-4 text-xs text-center text-muted-foreground">
            <p>© 2025 Jewelry Inventory</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              All rights reserved
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  );

  // Mobile sidebar with enhanced styling
  const mobileSidebar = (
    <div
      className={`
      fixed inset-0 bg-white from-background to-background/95 backdrop-blur-sm z-50 md:hidden
      transform transition-transform duration-300 ease-in-out
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between p-4 ">
          <div className="flex items-center space-x-3">
            <div className="flex aspect-square size-11 items-center justify-center rounded-full bg-yellow-100 border border-yellow-200 shadow-sm">
              <Gem className="size-6 text-yellow-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight">
                JEWELRY INVENTORY
              </span>
              <span className="text-xs text-muted-foreground">
                {isAdmin
                  ? 'Admin'
                  : 'Shopkeeper'
                  }
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
            className="rounded-full hover:bg-muted"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* User profile */}
        {user && (
          <div className="px-4 py-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-primary/10 ring-2 ring-background">
                <AvatarImage src={user.imageUrl} alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
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
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-muted/50 border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          <div className="space-y-1 px-3">
            {filteredLinks.map((link) => (
              <div key={link.label} className="mb-1">
                {link.subItems ? (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-left font-normal h-12 rounded-lg group"
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-3 p-2 rounded-md ${
                            pathname.startsWith(link.href)
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          <link.icon className="h-4 w-4" />
                        </div>
                        <span>{link.label}</span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="pl-12 space-y-1">
                      {link.subItems.map((subItem) => (
                        <Button
                          key={subItem.label}
                          variant="ghost"
                          className={`w-full justify-start text-left font-normal h-10 rounded-lg ${
                            pathname === subItem.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          asChild
                        >
                          <Link href={subItem.href} onClick={toggleMobileMenu}>
                            {subItem.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left font-normal h-12 rounded-lg ${
                      pathname === link.href
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                    asChild
                  >
                    <Link href={link.href} onClick={toggleMobileMenu}>
                      <div
                        className={`mr-3 p-2 rounded-md ${
                          pathname === link.href
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                      </div>
                      <span>{link.label}</span>
                      {link.badge && (
                        <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                          {link.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with logout */}
        <div className="border-t mt-auto p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-12 rounded-lg border-dashed text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Log out</span>
          </Button>
          <div className="mt-4 text-xs text-center text-muted-foreground">
            <p>© 2025 Jewelry Inventory</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Render both sidebars */}
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}

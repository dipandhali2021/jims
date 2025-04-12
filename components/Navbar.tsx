'use client';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { useUser, useClerk } from '@clerk/nextjs';
import { Search, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationDialog } from './NotificationDialog';

interface NavbarProps {
  isMobileOpen: boolean;
  toggleMobileMenu: () => void;
}

export default function Navbar({
  isMobileOpen,
  toggleMobileMenu,
}: NavbarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center flex-1 justify-end space-x-4">
          <div className="flex items-center space-x-4">
            <NotificationDialog />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage src={user.imageUrl} alt="User avatar" />
                      <AvatarFallback>
                        {user.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
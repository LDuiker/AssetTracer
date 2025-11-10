'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Settings, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    name: 'Loading...',
    email: '',
    avatar: '',
    initials: '...',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          // Check if it's an auth error (deleted user with valid JWT)
          if (error.message?.includes('User from sub claim in JWT does not exist') ||
              error.message?.includes('JWT') ||
              error.status === 401 ||
              error.status === 403) {
            console.warn('Invalid session detected in Header, clearing...');
            // Use local scope to avoid API call with invalid JWT
            await supabase.auth.signOut({ scope: 'local' });
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
            return;
          }
          console.error('Error fetching user:', error);
          return;
        }

        if (!user) {
          return;
        }

        // Get user metadata (name from Google OAuth)
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const email = user.email || '';
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        
        // Generate initials from name
        const nameParts = fullName.split(' ');
        const initials = nameParts.length >= 2 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : fullName.substring(0, 2).toUpperCase();

        setUserData({
          name: fullName,
          email,
          avatar,
          initials,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? (error as { status?: number }).status
            : undefined;

        // Check if it's an auth error (deleted user with valid JWT)
        if (
          message.includes('User from sub claim in JWT does not exist') ||
          message.includes('JWT') ||
          status === 401 ||
          status === 403
        ) {
          console.warn('Invalid session detected in Header catch, clearing...');
          const supabase = createClient();
          // Use local scope to avoid API call with invalid JWT
          await supabase.auth.signOut({ scope: 'local' });
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
          return;
        }
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error.message);
        toast.error('Failed to sign out. Please try again.');
        return;
      }

      // Show success message
      toast.success('Signed out successfully');
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 flex items-center justify-between">
      {/* Left Side - Mobile Menu Button + Page Title */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button - Only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">
          {title}
        </h1>
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-primary-blue rounded-full">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {userData.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userData.email}
                </p>
              </div>
              
              {/* Avatar */}
              <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-slate-600">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-primary-blue text-white font-semibold">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User Info Header */}
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {userData.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userData.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu Items */}
            <DropdownMenuItem
              onClick={handleSettings}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


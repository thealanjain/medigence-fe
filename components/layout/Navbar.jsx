'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/utils/helpers';
import { Activity, MessageSquare, Users, LayoutDashboard, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const patientNav = [
  { href: '/onboarding', label: 'Onboarding', icon: User },
  { href: '/doctors', label: 'Doctors', icon: Users },
  { href: '/chat', label: 'Messages', icon: MessageSquare },
];

const doctorNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Messages', icon: MessageSquare },
];

export default function Navbar() {
  const { user, role, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const navItems = role === 'PATIENT' ? patientNav : doctorNav;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={role === 'PATIENT' ? '/onboarding' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="medical-gradient rounded-lg p-1.5">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Medi<span className="text-primary">gence</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-2 rounded-lg font-medium',
                    pathname.startsWith(href) && 'bg-primary/10 text-blue-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="group relative flex items-center gap-3 rounded-full pl-1.5 pr-3 py-1.5 transition-all active:scale-95"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/10 transition-all">
                  <AvatarFallback className="medical-gradient text-white text-xs font-bold">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-foreground leading-tight tracking-tight">
                    {user?.email?.split('@')[0]}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-1 rounded-sm mt-0.5",
                    role === 'PATIENT' ? "text-primary/70" : "text-teal-600"
                  )}>
                    {role}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-border/50 rounded-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-3 mb-2 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white">
                    <AvatarFallback className="medical-gradient text-white font-bold text-sm">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "w-full justify-center text-[10px] font-bold py-0.5 border-0 rounded-md",
                      role === 'PATIENT' ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"
                    )}
                  >
                    {role} Account
                  </Badge>
                </div>
              </div>

              <DropdownMenuSeparator className="mx-1 my-1" />

              <DropdownMenuItem onClick={logout} className="rounded-lg h-10 cursor-pointer group text-destructive transition-all mt-1">
                <LogOut className="mr-2 h-4 w-4 transition-transform" />
                <span className="font-bold text-sm">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

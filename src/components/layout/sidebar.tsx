"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Calendar,
  Wallet,
  BookOpen,
  HelpCircle,
  Mail,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  Settings,
  Bell,
} from "lucide-react";
import { signout } from "@/apis/auth";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

const mainNavItems = [
  {
    name: "Dashboard",
    href: "/organizer/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Events",
    href: "/organizer/events",
    icon: Calendar,
  },
  {
    name: "Withdrawals",
    href: "/organizer/withdrawals",
    icon: Wallet,
  },
];

const bottomNavItems = [
  {
    name: "Guide",
    href: "/organizer/support/guide",
    icon: BookOpen,
  },
  {
    name: "FAQs",
    href: "/organizer/support/faqs",
    icon: HelpCircle,
  },
  {
    name: "Contact",
    href: "/organizer/support/contact",
    icon: Mail,
  },
];

const adminNavItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "All Events",
    href: "/admin/events",
    icon: Calendar,
  },
  {
    name: "Organizers",
    href: "/admin/organizers",
    icon: Users,
  },
  {
    name: "Withdrawals",
    href: "/admin/withdrawals",
    icon: Wallet,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const NavItem = ({ item }: { item: (typeof mainNavItems)[0] }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          "hover:bg-purple-accent/20",
          isActive
            ? "bg-gold-primary/20 text-gold-primary border-r-2 border-gold-primary"
            : "text-text-secondary hover:text-text-primary",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive
              ? "text-gold-primary"
              : "text-purple-accent group-hover:text-text-primary",
          )}
        />
        {!collapsed && (
          <span className="text-sm font-medium whitespace-nowrap">
            {item.name}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-purple-surface border-purple-accent text-text-primary"
          >
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const BottomNavItem = ({ item }: { item: (typeof bottomNavItems)[0] }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
          "hover:bg-purple-accent/20",
          isActive
            ? "bg-gold-primary/20 text-gold-primary"
            : "text-text-secondary hover:text-text-primary",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-purple-accent group-hover:text-text-primary" />
        {!collapsed && (
          <span className="text-xs font-medium whitespace-nowrap">
            {item.name}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-purple-surface border-purple-accent text-text-primary"
          >
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-purple-surface border-r border-purple-accent/30",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-purple-accent/30">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center border border-purple-accent/30">
              <Image
                src="/logo.png"
                alt="Tomame"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-text-primary text-lg">
              Tomame
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-text-secondary hover:text-text-primary hover:bg-purple-accent/20",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        {collapsed && (
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 top-4">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center border border-purple-accent/30">
              <Image
                src="/logo.png"
                alt="Tomame"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
          </Link>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-2 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold text-purple-accent uppercase tracking-wider">
            Main Menu
          </p>
        )}
        <TooltipProvider delayDuration={0}>
          {mainNavItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </TooltipProvider>
      </div>

      <Separator className="bg-purple-accent/30 mx-2" />

      {/* Admin Navigation - Only for admin users */}
      {user?.role === "admin" && (
        <>
          <div className="py-2 px-2 space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-gold-primary uppercase tracking-wider">
                Admin
              </p>
            )}
            <TooltipProvider delayDuration={0}>
              {adminNavItems.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </TooltipProvider>
          </div>
          <Separator className="bg-purple-accent/30 mx-2" />
        </>
      )}

      {/* Bottom Navigation */}
      <div className="py-4 px-2 space-y-1">
        <TooltipProvider delayDuration={0}>
          {bottomNavItems.map((item) => (
            <BottomNavItem key={item.name} item={item} />
          ))}
        </TooltipProvider>
      </div>

      <Separator className="bg-purple-accent/30 mx-2" />

      {/* User Info Popover */}
      <div className="p-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center gap-3 p-2 h-auto hover:bg-purple-accent/20",
                collapsed && "justify-center",
              )}
            >
              <Avatar className="h-8 w-8 border-2 border-gold-primary">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-purple-accent text-text-primary text-sm">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {user?.role || "Organizer"}
                  </p>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 bg-purple-surface border-purple-accent text-text-primary"
            align={collapsed ? "center" : "start"}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-gold-primary">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-purple-accent text-text-primary">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-text-primary">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <Separator className="bg-purple-accent/30" />
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                  asChild
                >
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                  asChild
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                  asChild
                >
                  <Link href="/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </Button>
              </div>
              <Separator className="bg-purple-accent/30" />
              <Button
                variant="ghost"
                onClick={() => signout()}
                className="w-full justify-start text-error hover:text-error hover:bg-error/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-purple-surface border border-purple-accent/30 text-text-primary"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen transition-transform duration-300 ease-in-out",
          "md:translate-x-0 md:static md:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Users, Vote } from "lucide-react";

interface EventsLayoutProps {
  children: ReactNode;
}

export default function EventsLayout({ children }: EventsLayoutProps) {
  const pathname = usePathname();
  const eventBasePath = pathname.split('/').slice(0, 3).join('/');

  const navItems = [
    { href: eventBasePath, label: "Event Details", icon: Calendar },
    { href: `${eventBasePath}/nominees`, label: "Nominees", icon: Users },
    { href: `${eventBasePath}/voting`, label: "Voting", icon: Vote },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 p-1 bg-purple-surface/50 rounded-lg border border-purple-accent/20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-gold-primary text-purple-bg shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
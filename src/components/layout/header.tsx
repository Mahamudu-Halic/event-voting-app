"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight, Bell, Search } from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    notifications?: number;
  };
  showBreadcrumb?: boolean;
  className?: string;
}

export function Header({
  user,
  showBreadcrumb = true,
  className,
}: HeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const getBreadcrumbItems = () => {
    const paths = pathname.split("/").filter(Boolean);
    return paths.map((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/");
      const isLast = index === paths.length - 1;
      const label =
        path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

      return { href, label, isLast };
    });
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "bg-purple-surface/80 backdrop-blur-md border-b border-purple-accent/30",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Breadcrumb */}
        <div className="flex items-center gap-4">
          {showBreadcrumb && breadcrumbItems.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList className="text-text-secondary">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="hover:text-gold-primary transition-colors"
                  >
                    <Link href="/">
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-purple-accent">
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                {breadcrumbItems.map((item) => (
                  <div key={item.href} className="flex items-center">
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="text-text-primary font-medium">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="hover:text-gold-primary transition-colors"
                        >
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!item.isLast && (
                      <BreadcrumbSeparator className="text-purple-accent mx-2">
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                    )}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Landing Page Link */}
          <Button
            variant="outline"
            size="sm"
            className="border-gold-primary text-text-primary bg-gold-dark hover:bg-gold-primary hover:text-text-tertiary transition-colors"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

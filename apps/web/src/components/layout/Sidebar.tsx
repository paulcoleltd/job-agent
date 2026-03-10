"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bookmark, FileText, Settings, Briefcase, BarChart2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shortlist", label: "Shortlist", icon: Bookmark },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/tracker", label: "Tracker", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/test-dashboard", label: "Tests", icon: FlaskConical },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r bg-card flex flex-col py-6 px-3 gap-1 shrink-0">
      <div className="flex items-center gap-2 px-3 mb-6">
        <Briefcase className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Job Agent</span>
      </div>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </aside>
  );
}

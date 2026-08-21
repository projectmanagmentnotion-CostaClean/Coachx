import { useTranslator } from "@/components/locale-provider";
import Link from "next/link";
import type { BottomTab } from "@/lib/coachx-data";

interface BottomNavProps {
  active: BottomTab;
}

export function BottomNav({ active }: BottomNavProps) {
  const { t } = useTranslator();
  const tabs: Array<{ href: string; label: string; icon: string; id: BottomTab }> = [
    { href: "/", label: t("nav.today"), icon: "today", id: "today" },
    { href: "/calendar", label: t("nav.calendar"), icon: "calendar_today", id: "calendar" },
    { href: "/nutrition", label: t("nav.nutrition"), icon: "restaurant", id: "nutrition" },
    { href: "/progress", label: t("nav.progress"), icon: "insights", id: "progress" },
    { href: "/profile", label: t("nav.profile"), icon: "person", id: "profile" }
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((tab) => (
        <Link key={tab.id} href={tab.href} className={`nav-item ${tab.id === active ? "active" : ""}`}>
          <span className={`icon ${tab.id === active ? "filled" : ""}`} aria-hidden="true">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

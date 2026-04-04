"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/lib/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, AlertTriangle, TrendingDown, Activity, Target } from "lucide-react";

const ALERT_ICONS = {
  at_risk: AlertTriangle,
  coaching: TrendingDown,
  pipeline: Activity,
  low_score: Target,
};

const SEVERITY_STYLES = {
  red: "text-red-600 dark:text-red-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
};

export function NotificationsBell() {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-[10px] text-muted-foreground">{alerts.length} alerts</p>
        </div>
        {alerts.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            All clear — no alerts
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {alerts.map((alert) => {
              const Icon = ALERT_ICONS[alert.type];
              return (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${SEVERITY_STYLES[alert.severity]}`} />
                  <span className="text-xs leading-snug">{alert.text}</span>
                </Link>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

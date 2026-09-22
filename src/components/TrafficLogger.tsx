"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function TrafficLogger() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const sessionKey = "kas_rt_traffic_session_id";
    let sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(sessionKey, sessionId);
    }

    const payload = {
      path: pathname,
      visitorType: user ? "warga" : "umum",
      username: user?.username || null,
      role: user?.role || null,
      houseNumber: user?.houseNumber || null,
      sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    };

    fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, user?.username, user?.role, user?.houseNumber, user]);

  return null;
}

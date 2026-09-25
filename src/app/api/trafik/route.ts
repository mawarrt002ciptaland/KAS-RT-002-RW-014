import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const since = new Date(Date.now() - days * 86400000);

    const records = await db.trafikWebsite.findMany({
      where: { tanggal: { gte: since } },
      orderBy: { tanggal: "asc" },
    });

    // Aggregate per day
    const perDay = new Map<string, { views: number; visitors: number; sessions: number }>();
    for (const r of records) {
      const k = monthKey(r.tanggal) + "-" + String(new Date(r.tanggal).getDate()).padStart(2, "0");
      const cur = perDay.get(k) || { views: 0, visitors: 0, sessions: 0 };
      cur.views += r.pageViews;
      cur.visitors += r.visitors;
      cur.sessions += r.sessions;
      perDay.set(k, cur);
    }
    const daily = Array.from(perDay.entries()).map(([k, v]) => {
      const d = new Date(k + "T00:00:00");
      return { date: k, label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), ...v };
    });

    // Device breakdown
    const deviceMap = new Map<string, { views: number; visitors: number }>();
    for (const r of records) {
      const cur = deviceMap.get(r.device) || { views: 0, visitors: 0 };
      cur.views += r.pageViews;
      cur.visitors += r.visitors;
      deviceMap.set(r.device, cur);
    }
    const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, v]) => ({ device, ...v }));

    // Top referrers
    const refMap = new Map<string, number>();
    for (const r of records) {
      if (r.referrer) refMap.set(r.referrer, (refMap.get(r.referrer) ?? 0) + r.visitors);
    }
    const topReferrers = Array.from(refMap.entries()).map(([name, visitors]) => ({ name, visitors })).sort((a, b) => b.visitors - a.visitors).slice(0, 6);

    // Top pages
    const pageMap = new Map<string, number>();
    for (const r of records) {
      if (r.page) pageMap.set(r.page, (pageMap.get(r.page) ?? 0) + r.pageViews);
    }
    const topPages = Array.from(pageMap.entries()).map(([page, views]) => ({ page, views })).sort((a, b) => b.views - a.views);

    const totalViews = records.reduce((s, r) => s + r.pageViews, 0);
    const totalVisitors = records.reduce((s, r) => s + r.visitors, 0);
    const totalSessions = records.reduce((s, r) => s + r.sessions, 0);

    return NextResponse.json({
      totalViews,
      totalVisitors,
      totalSessions,
      daily,
      deviceBreakdown,
      topReferrers,
      topPages,
    });
  } catch (e) {
    console.error("[api/trafik GET]", e);
    return NextResponse.json({ error: "Gagal memuat trafik" }, { status: 500 });
  }
}

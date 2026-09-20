import { NextResponse } from "next/server";
import { db } from "@/db";
import { trafficLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

const FALLBACK_TRAFFIC = [
  { path: "/dashboard", visitorType: "warga", username: "bayu", role: "warga", houseNumber: "M-02", sessionId: "fallback-1", createdAt: new Date().toISOString() },
  { path: "/tagihan", visitorType: "warga", username: "bayu", role: "warga", houseNumber: "M-02", sessionId: "fallback-1", createdAt: new Date().toISOString() },
  { path: "/login", visitorType: "umum", username: null, role: null, houseNumber: null, sessionId: "fallback-2", createdAt: new Date().toISOString() },
  { path: "/marketplace", visitorType: "umum", username: null, role: null, houseNumber: null, sessionId: "fallback-3", createdAt: new Date().toISOString() },
];

export async function GET() {
  try {
    try {
      const rows = await db.select().from(trafficLogs).orderBy(desc(trafficLogs.createdAt));
      const totalVisits = rows.length;
      const uniqueSessions = new Set(rows.map((r) => r.sessionId)).size;
      const wargaVisits = rows.filter((r) => r.visitorType === "warga").length;
      const umumVisits = rows.filter((r) => r.visitorType === "umum").length;

      const perPathMap = new Map<string, number>();
      for (const row of rows) {
        perPathMap.set(row.path, (perPathMap.get(row.path) || 0) + 1);
      }
      const topPages = Array.from(perPathMap.entries())
        .map(([path, visits]) => ({ path, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      return NextResponse.json({
        logs: rows,
        summary: { totalVisits, uniqueSessions, wargaVisits, umumVisits, topPages },
        source: "database",
      });
    } catch {
      const rows = FALLBACK_TRAFFIC;
      const totalVisits = rows.length;
      const uniqueSessions = new Set(rows.map((r) => r.sessionId)).size;
      const wargaVisits = rows.filter((r) => r.visitorType === "warga").length;
      const umumVisits = rows.filter((r) => r.visitorType === "umum").length;
      return NextResponse.json({
        logs: rows,
        summary: {
          totalVisits,
          uniqueSessions,
          wargaVisits,
          umumVisits,
          topPages: [
            { path: "/dashboard", visits: 1 },
            { path: "/tagihan", visits: 1 },
            { path: "/login", visits: 1 },
            { path: "/marketplace", visits: 1 },
          ],
        },
        source: "fallback",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ logs: FALLBACK_TRAFFIC, summary: { totalVisits: 4, uniqueSessions: 3, wargaVisits: 2, umumVisits: 2, topPages: [{ path: "/dashboard", visits: 1 }] }, source: "fallback" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, visitorType = "umum", username = null, role = null, houseNumber = null, sessionId, userAgent = null, referrer = null } = body;

    if (!path || !sessionId) {
      return NextResponse.json({ error: "Path dan sessionId wajib dikirim" }, { status: 400 });
    }

    try {
      const [created] = await db
        .insert(trafficLogs)
        .values({ path, visitorType, username, role, houseNumber, sessionId, userAgent, referrer })
        .returning();
      return NextResponse.json({ success: true, log: created, source: "database" });
    } catch {
      return NextResponse.json({ success: true, source: "fallback-no-db" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: true, source: "fallback-no-db" });
  }
}

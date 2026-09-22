import { NextResponse } from "next/server";
import { db } from "@/db";
import { trafficLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(trafficLogs).orderBy(desc(trafficLogs.createdAt));
    const totalVisits = rows.length;
    const uniqueSessions = new Set(rows.map((r) => r.sessionId)).size;
    const wargaVisits = rows.filter((r) => r.visitorType === "warga").length;
    const umumVisits = rows.filter((r) => r.visitorType === "umum").length;

    const perPathMap = new Map<string, number>();
    for (const row of rows) perPathMap.set(row.path, (perPathMap.get(row.path) || 0) + 1);
    const topPages = Array.from(perPathMap.entries()).map(([path, visits]) => ({ path, visits })).sort((a, b) => b.visits - a.visits).slice(0, 10);

    return NextResponse.json({ logs: rows, summary: { totalVisits, uniqueSessions, wargaVisits, umumVisits, topPages }, source: "database" });
  } catch (error: any) {
    return NextResponse.json(
      {
        logs: [],
        summary: { totalVisits: 0, uniqueSessions: 0, wargaVisits: 0, umumVisits: 0, topPages: [] },
        source: "database-error",
        error: error?.message || "Gagal membaca traffic_logs dari Neon",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, visitorType = "umum", username = null, role = null, houseNumber = null, sessionId, userAgent = null, referrer = null } = body;
    if (!path || !sessionId) return NextResponse.json({ error: "Path dan sessionId wajib dikirim" }, { status: 400 });

    const [created] = await db.insert(trafficLogs).values({ path, visitorType, username, role, houseNumber, sessionId, userAgent, referrer }).returning();
    return NextResponse.json({ success: true, log: created, source: "database" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal menyimpan traffic_logs ke Neon", source: "database-error" }, { status: 500 });
  }
}

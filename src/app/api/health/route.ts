// app/api/health/route.ts — versi Prisma
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // sesuaikan dengan path singleton Anda

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, unknown> = {};
  const dbUrl = process.env.DATABASE_URL;
  checks.database_url = dbUrl
    ? `TERSEDIA (${dbUrl.includes('-pooler') ? 'pooled' : 'DIRECT — perlu diganti'})`
    : 'TIDAK DISET';

  if (dbUrl) {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.prisma_koneksi = `OK (${Date.now() - start}ms)`;
      const t = await prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public'`;
      checks.jumlah_tabel = t[0].count;
    } catch (err: any) {
      checks.prisma_koneksi = `GAGAL — ${err.message?.slice(0, 200)}`;
    }
  }

  const ok = String(checks.prisma_koneksi ?? '').startsWith('OK');
  return NextResponse.json({ ok, time: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 });
}

// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // ← sesuaikan jika file Anda ternyata bernama lain

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
      await db.$queryRaw`SELECT 1`;
      checks.prisma_koneksi = `OK (${Date.now() - start}ms)`;
      const t = await db.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public'`;
      checks.jumlah_tabel = t[0].count;
    } catch (err: any) {
      checks.prisma_koneksi = `GAGAL — ${err.message?.slice(0, 200)}`;
    }
    // sengaja TIDAK memanggil db.$disconnect() — ini instance bersama aplikasi
  }

  const ok = String(checks.prisma_koneksi ?? '').startsWith('OK');
  return NextResponse.json({ ok, time: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 });
}

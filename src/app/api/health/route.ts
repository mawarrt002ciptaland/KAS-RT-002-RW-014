import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, unknown> = {};
  const dbUrl = process.env.DATABASE_URL;
  checks.database_url = dbUrl ? 'TERSEDIA' : 'TIDAK DISET';

  if (dbUrl) {
    try {
      const start = Date.now();
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await pool.query('SELECT 1');
      checks.koneksi = `OK (${Date.now() - start}ms)`;
      const t = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
      );
      checks.jumlah_tabel = t.rowCount;
      await pool.end();
    } catch (err: any) {
      checks.koneksi = `GAGAL — ${err.code ?? ''} ${err.message?.slice(0, 120)}`;
    }
  }

  const ok = String(checks.koneksi ?? '').startsWith('OK');
  return NextResponse.json({ ok, time: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 });
}
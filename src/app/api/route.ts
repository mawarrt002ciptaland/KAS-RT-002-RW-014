import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Sistem Informasi RT 002",
    blok: "Mawar",
    perumahan: "Ciptaland",
    status: "online",
    version: "1.0.0",
  });
}

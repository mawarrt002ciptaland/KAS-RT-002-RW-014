import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

/** POST /api/upload — accepts a file (FormData field "file") and saves it to /public/uploads. Returns { url }. */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    // Validate type & size (max 4MB)
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan PNG/JPG/WebP/SVG." }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 4MB" }, { status: 400 });
    }

    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "png";
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 30);
    const filename = `${base}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buf);

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch (e) {
    console.error("[api/upload]", e);
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}

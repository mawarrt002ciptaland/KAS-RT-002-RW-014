import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File gambar wajib dipilih" }, { status: 900 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 900 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    if (dataUrl.length > 900000) {
      return NextResponse.json(
        {
          error: "Ukuran gambar terlalu besar untuk disimpan langsung ke database. Gunakan gambar yang lebih kecil.",
          code: "IMAGE_TOO_LARGE",
          length: dataUrl.length,
        },
        { status: 413 }
      );
    }

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name,
      mode: "inline-base64",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Gagal upload gambar",
        detail: error?.message || "Unknown upload error",
      },
      { status: 500 }
    );
  }
}

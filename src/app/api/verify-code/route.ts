
import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!code || !email) {
      return NextResponse.json({ success: false, message: "Email dan kode verifikasi wajib diisi" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbConnection();
    // Hapus kode kadaluarsa
    await db.execute(`DELETE FROM verification_codes WHERE expires_at < NOW()`);
    // Cari kode di database
    const [rows]: any = await db.execute(
      "SELECT * FROM verification_codes WHERE code = ? AND TRIM(LOWER(email)) = ? AND expires_at > NOW()",
      [code, cleanEmail]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Kode verifikasi tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }
    // Jika valid, kirim respons sukses
    return NextResponse.json({ success: true, message: "Kode verifikasi valid" }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, message: "Gagal verifikasi kode", error: String(error) }, { status: 500 });
  }
}


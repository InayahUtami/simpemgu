
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, code } = await req.json();
    if (!email || !password || !code) {
      return NextResponse.json({ success: false, message: "Email, password, dan kode verifikasi wajib diisi" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbConnection();
    // Cek kode verifikasi valid
    const [rows]: any = await db.execute(
      "SELECT * FROM verification_codes WHERE code = ? AND TRIM(LOWER(email)) = ? AND expires_at > NOW()",
      [code, cleanEmail]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Kode verifikasi tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }
    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update password di admin
    await db.execute("UPDATE admin SET password = ? WHERE TRIM(LOWER(email)) = ?", [hashedPassword, cleanEmail]);
    // Hapus kode verifikasi setelah reset
    await db.execute("DELETE FROM verification_codes WHERE code = ? AND TRIM(LOWER(email)) = ?", [code, cleanEmail]);
    return NextResponse.json({ success: true, message: "Password berhasil direset" }, { status: 200 });
  } catch (error) {
    console.error("Gagal reset password:", error);
    return NextResponse.json({ success: false, message: "Gagal reset password", error: String(error) }, { status: 500 });
  }
}


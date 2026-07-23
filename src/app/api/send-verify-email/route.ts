import nodemailer from "nodemailer";
import moment from "moment-timezone";
import { getDbConnection } from '@/lib/db';

const EMAIL_USER = "inayahutami12@gmail.com";
const EMAIL_PASSWORD = "bcwr wwmp gfoa japf";

async function emailExists(db: any, email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const [adminRows] = await db.execute("SELECT * FROM admin WHERE TRIM(LOWER(email)) = ?", [cleanEmail]);
  if (adminRows.length > 0) return true;
  const [userRows] = await db.execute("SELECT * FROM user WHERE TRIM(LOWER(email)) = ?", [cleanEmail]);
  return userRows.length > 0;
}

async function addVerificationCode(db: any, email: string, verificationCode: number): Promise<boolean> {
  const query = `
    INSERT INTO verification_codes (email, code, expires_at)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`;
  const expiresAt = moment()
    .tz("Asia/Jakarta")
    .add(10, "minutes")
    .format("YYYY-MM-DD HH:mm:ss");
  const [rows] = await db.execute(query, [email, verificationCode, expiresAt]);
  return rows.affectedRows > 0;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ message: "Email wajib diisi" }), { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const db = await getDbConnection();
    const isEmailExists = await emailExists(db, cleanEmail);
    if (!isEmailExists) {
      return new Response(JSON.stringify({ message: "Email tidak ditemukan. Silakan periksa email Anda.", data: cleanEmail }), { status: 401 });
    }
    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    await addVerificationCode(db, cleanEmail, verificationCode);
    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
    // Email options
    const mailOptions = {
      from: EMAIL_USER,
      to: cleanEmail,
      subject: "Kode Verifikasi Anda",
      text: `Kode verifikasi Anda adalah: ${verificationCode}`,
    };
    // Send email
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: "Kode verifikasi berhasil dikirim", code: verificationCode }), { status: 200 });
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    return new Response(JSON.stringify({ message: "Gagal mengirim email" }), { status: 500 });
  }
}


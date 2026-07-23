import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from "nodemailer";
import moment from "moment-timezone";

import { getDbConnection, RowDataPacket, ResultSetHeader } from '@/lib/db';

const EMAIL_USER = "inayahutami12@gmail.com";
const EMAIL_PASSWORD = "bcwr wwmp gfoa japf";

const db = await getDbConnection();

async function emailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const [adminRows] = await db.execute<RowDataPacket[]>("SELECT * FROM admin WHERE TRIM(LOWER(email)) = ?", [cleanEmail]);
  if (adminRows.length > 0) return true;
  const [userRows] = await db.execute<RowDataPacket[]>("SELECT * FROM user WHERE TRIM(LOWER(email)) = ?", [cleanEmail]);
  return userRows.length > 0;
}

async function addVerificationCode(email: string, verificationCode: number): Promise<boolean> {
  const query = `
  INSERT INTO verification_codes (email, code, expires_at) 
  VALUES (?, ?, ?) 
  ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`;

  // Set waktu kedaluwarsa (misalnya 10 menit dari sekarang)
  const expiresAt =  moment()
    .tz("Asia/Jakarta")
    .add(10, "minutes")
    .format("YYYY-MM-DD HH:mm:ss");

  const [rows] = await db.execute<ResultSetHeader>(query, [email, verificationCode, expiresAt]);
  return rows.affectedRows > 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const isEmailExists = await emailExists(cleanEmail);

    if (!isEmailExists) {
      return res.status(401).json({ message: "Email not found. Please check your email.", data: cleanEmail });
    }
    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    await addVerificationCode(cleanEmail, verificationCode);

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail", // Sesuaikan dengan layanan email yang digunakan
      auth: {
        user: EMAIL_USER, // Masukkan email pengirim di .env
        pass: EMAIL_PASSWORD, // Masukkan password aplikasi di .env
      },
    });

    // Email options
    const mailOptions = {
      from: EMAIL_USER,
      to: cleanEmail,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Verification code sent successfully", code: verificationCode });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
}


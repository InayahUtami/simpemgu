import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    console.log('LOGIN: Proses login dimulai');
    const { email, password } = await req.json();
    if (!email || !password) {
      console.log('LOGIN: Email/password kosong');
      return NextResponse.json({ success: false, message: 'Email dan password wajib diisi' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await query('SELECT * FROM admin WHERE TRIM(LOWER(email)) = ? LIMIT 1', [cleanEmail]);
    if (!user || user.length === 0) {
      console.log('LOGIN FAIL: Email tidak ditemukan', { email: cleanEmail });
      return NextResponse.json({ success: false, message: 'Email tidak ditemukan' }, { status: 404 });
    }
    // Debug log
    console.log('LOGIN DEBUG:', {
      inputEmail: cleanEmail,
      inputPassword: password,
      dbHash: user[0].password,
    });
    const match = await bcrypt.compare(password, user[0].password);
    console.log('LOGIN DEBUG: bcrypt.compare result:', match);
    if (!match) {
      console.log('LOGIN FAIL: Password salah');
      return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 });
    }
    // Return user data (without password)
    const { password: _, ...userData } = user[0];
    console.log('LOGIN SUCCESS:', userData);
    
    // Generate unique session ID
    const sessionId = randomUUID();
    
    // Simpan session ke database (berlaku 24 jam)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO admin_sessions (session_id, admin_id, expires_at) VALUES (?, ?, ?)',
      [sessionId, user[0].id, expiresAt]
    );
    console.log('LOGIN: Session disimpan ke DB:', { sessionId, adminId: user[0].id });
    
    // Buat response dengan cookie
    const response = NextResponse.json({ success: true, data: userData });
    
    // Set cookie berisi session_id (bukan user data)
    // Untuk ngrok, gunakan secure: false dan sameSite: 'none' atau 'lax'
    response.cookies.set({
      name: 'admin_session_id',
      value: sessionId,
      httpOnly: true,
      secure: false, // Set false untuk ngrok development
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 jam
    });
    
    console.log('LOGIN: Cookie di-set:', { sessionId, cookieName: 'admin_session_id' });
    
    return response;
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return NextResponse.json({ success: false, message: 'Gagal login', error: String(error) }, { status: 500 });
  }
}


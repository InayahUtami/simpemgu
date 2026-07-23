import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session_id')?.value;

    if (sessionId) {
      // Hapus session dari database
      await query('DELETE FROM admin_sessions WHERE session_id = ?', [sessionId]);
      console.log('LOGOUT: Session dihapus dari DB:', sessionId);
    }

    // Buat response
    const response = NextResponse.json({ success: true, message: 'Logout berhasil' });

    // Hapus cookie admin_session_id
    response.cookies.set({
      name: 'admin_session_id',
      value: '',
      httpOnly: true,
      maxAge: 0 // Hapus immediately
    });

    console.log('LOGOUT: Sukses');
    return response;
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
    return NextResponse.json({ success: false, message: 'Gagal logout' }, { status: 500 });
  }
}



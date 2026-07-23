import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Helper: get user profile (assume single admin user for simplicity)
async function getProfile() {
  const result = await query(`SELECT id, nama, email, foto_profil FROM admin LIMIT 1`);
  if (!result || result.length === 0) return null;
  return result[0];
}

export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    const response = NextResponse.json({ success: true, data: profile });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal mengambil profil', error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { nama, email, foto_profil, password, old_password } = body;
    
    // Get current user
    const user = await query(`SELECT * FROM admin LIMIT 1`);
    if (!user || user.length === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    const current = user[0];
    
    // Password update logic
    if (password) {
      if (!old_password) {
        return NextResponse.json({ success: false, message: 'Password lama harus diisi' }, { status: 400 });
      }
      const match = await bcrypt.compare(old_password, current.password);
      if (!match) {
        return NextResponse.json({ success: false, message: 'Password lama salah' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update dengan password
      await query(
        `UPDATE admin SET nama = ?, email = ?, foto_profil = ?, password = ? WHERE id = ?`,
        [nama, email, foto_profil || null, hashedPassword, current.id]
      );
    } else {
      // Update tanpa password
      await query(
        `UPDATE admin SET nama = ?, email = ?, foto_profil = ? WHERE id = ?`,
        [nama, email, foto_profil || null, current.id]
      );
    }
    
    // Return updated profile
    const updated = await getProfile();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengupdate profil', error: String(error) }, { status: 500 });
  }
}


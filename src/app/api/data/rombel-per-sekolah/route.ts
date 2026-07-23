import { NextResponse, NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db';

/**
 * GET /api/data/rombel-per-sekolah
 * Menampilkan jumlah rombel per sekolah dalam satu kecamatan per tahun
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kecamatanId = searchParams.get('kecamatan_id');
    const tahun = searchParams.get('tahun');
    const sekolah = searchParams.get('sekolah');

    if (!kecamatanId) {
      return NextResponse.json(
        { success: false, error: 'kecamatan_id is required' },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    // Get kecamatan name
    const [kecamatanRows] = await connection.query(
      'SELECT id, nama FROM kecamatan WHERE id = ? LIMIT 1',
      [kecamatanId]
    );

    const kecamatanData = (kecamatanRows as any[]).length > 0 ? (kecamatanRows as any[])[0] : null;

    let query = `
      SELECT 
        no,
        nama_sekolah,
        tahun,
        jumlah_rombel
      FROM view_rombel_per_sekolah
      WHERE kecamatan_id = ?
    `;

    const params: any[] = [kecamatanId];

    if (tahun) {
      query += ` AND tahun = ?`;
      params.push(tahun);
    }

    if (sekolah) {
      query += ` AND nama_sekolah LIKE ?`;
      params.push(`%${sekolah}%`);
    }

    query += ` ORDER BY tahun DESC, nama_sekolah ASC`;

    const [rows] = await connection.query(query, params);
    await connection.end();

    return NextResponse.json({
      success: true,
      kecamatan: kecamatanData,
      data: rows,
      count: (rows as any).length
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data/rombel-per-sekolah
 * Tambah kolom tahun baru untuk semua sekolah di kecamatan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kecamatan_id, tahun } = body;

    if (!kecamatan_id || !tahun) {
      return NextResponse.json({ success: false, error: 'kecamatan_id dan tahun wajib diisi' }, { status: 400 });
    }

    const connection = await getDbConnection();

    // Cek apakah tahun sudah ada untuk kecamatan ini
    const [existing] = await connection.query(
      'SELECT id FROM data_rombel_sekolah WHERE kecamatan_id = ? AND tahun = ? LIMIT 1',
      [kecamatan_id, tahun]
    );
    if ((existing as any[]).length > 0) {
      await connection.end();
      return NextResponse.json({ success: false, error: `Tahun ${tahun} sudah ada` }, { status: 409 });
    }

    // Ambil semua sekolah di kecamatan
    const [schools] = await connection.query(
      'SELECT id, nama_sekolah FROM sekolah_dasar WHERE kecamatan_id = ?',
      [kecamatan_id]
    );

    if ((schools as any[]).length === 0) {
      await connection.end();
      return NextResponse.json({ success: false, error: 'Tidak ada sekolah di kecamatan ini' }, { status: 404 });
    }

    for (const school of schools as any[]) {
      await connection.query(
        'INSERT INTO data_rombel_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_rombel) VALUES (?, ?, ?, ?, 0)',
        [school.id, kecamatan_id, school.nama_sekolah, tahun]
      );
    }

    await connection.end();
    return NextResponse.json({ success: true, message: `Tahun ${tahun} berhasil ditambahkan` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/data/rombel-per-sekolah
 * Update nilai rombel per sekolah per tahun
 * Body: { updates: [{ nama_sekolah, kecamatan_id, tahun, value }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: 'updates tidak boleh kosong' }, { status: 400 });
    }

    const connection = await getDbConnection();
    for (const u of updates) {
      const { nama_sekolah, kecamatan_id, tahun, value } = u;
      await connection.query(
        'UPDATE data_rombel_sekolah SET jumlah_rombel = ?, updated_at = NOW() WHERE kecamatan_id = ? AND nama_sekolah = ? AND tahun = ?',
        [Number(value) || 0, kecamatan_id, nama_sekolah, tahun]
      );
    }

    await connection.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/data/rombel-per-sekolah?kecamatan_id=xxx&tahun=xxx
 * Hapus kolom tahun untuk semua sekolah di kecamatan
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const kecamatan_id = searchParams.get('kecamatan_id');
    const tahun = searchParams.get('tahun');

    if (!kecamatan_id || !tahun) {
      return NextResponse.json({ success: false, error: 'kecamatan_id dan tahun wajib diisi' }, { status: 400 });
    }

    const connection = await getDbConnection();
    await connection.query(
      'DELETE FROM data_rombel_sekolah WHERE kecamatan_id = ? AND tahun = ?',
      [kecamatan_id, tahun]
    );
    await connection.end();

    return NextResponse.json({ success: true, message: `Tahun ${tahun} berhasil dihapus` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


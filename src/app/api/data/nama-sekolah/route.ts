import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

/**
 * GET /api/data/nama-sekolah
 * Menampilkan daftar nama sekolah dasar beserta kecamatan
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kecamatan = searchParams.get('kecamatan');
    const kecamatan_id = searchParams.get('kecamatan_id');
    const sekolah = searchParams.get('sekolah');

    const connection = await getDbConnection();

    let query = `
      SELECT
        sd.id,
        sd.kecamatan_id,
        k.nama AS kecamatan,
        sd.nama_sekolah,
        sd.status
      FROM sekolah_dasar sd
      JOIN kecamatan k ON k.id = sd.kecamatan_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (kecamatan_id) {
      query += ' AND sd.kecamatan_id = ?';
      params.push(Number(kecamatan_id));
    } else if (kecamatan) {
      query += ' AND k.nama LIKE ?';
      params.push(`%${kecamatan}%`);
    }

    if (sekolah) {
      query += ' AND sd.nama_sekolah LIKE ?';
      params.push(`%${sekolah}%`);
    }

    query += ' ORDER BY k.nama ASC, sd.nama_sekolah ASC';

    const [rows] = await connection.query(query, params);
    await connection.end();

    return NextResponse.json({
      success: true,
      data: rows,
      count: (rows as any[]).length,
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let connection: any;
  try {
    const body = await request.json();
    const { kecamatan_id, nama_sekolah, status } = body;

    if (!kecamatan_id || !nama_sekolah || !status) {
      return NextResponse.json(
        { success: false, error: 'kecamatan_id, nama_sekolah, dan status wajib diisi.' },
        { status: 400 }
      );
    }

    const parsedKecamatanId = Number(kecamatan_id);
    if (Number.isNaN(parsedKecamatanId) || parsedKecamatanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'kecamatan_id harus angka valid.' },
        { status: 400 }
      );
    }

    if (status !== 'Negeri' && status !== 'Swasta') {
      return NextResponse.json(
        { success: false, error: 'status harus Negeri atau Swasta.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    const [existingKecamatan] = await connection.query(
      'SELECT id FROM kecamatan WHERE id = ?',
      [parsedKecamatanId]
    );

    if ((existingKecamatan as any[]).length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'kecamatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const [existingSekolah] = await connection.query(
      'SELECT id FROM sekolah_dasar WHERE kecamatan_id = ? AND nama_sekolah = ?',
      [parsedKecamatanId, nama_sekolah.trim()]
    );

    if ((existingSekolah as any[]).length > 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'Nama sekolah sudah ada di kecamatan ini.' },
        { status: 409 }
      );
    }

    await connection.beginTransaction();

    const [result]: any = await connection.query(
      'INSERT INTO sekolah_dasar (kecamatan_id, nama_sekolah, status) VALUES (?, ?, ?)',
      [parsedKecamatanId, nama_sekolah.trim(), status]
    );

    const sekolahId = result.insertId;

    const tables = [
      { name: 'data_guru_sekolah', field: 'jumlah_guru' },
      { name: 'data_siswa_sekolah', field: 'jumlah_siswa' },
      { name: 'data_rombel_sekolah', field: 'jumlah_rombel' },
    ];

    // Kumpulkan semua tahun yang ada di salah satu tabel data_*
    const [allYearsRows]: any = await connection.query(`
      SELECT DISTINCT tahun FROM (
        SELECT tahun FROM data_guru_sekolah
        UNION
        SELECT tahun FROM data_siswa_sekolah
        UNION
        SELECT tahun FROM data_rombel_sekolah
      ) AS all_years
      ORDER BY tahun ASC
    `);

    let years = (allYearsRows as any[]).map((row) => row.tahun);

    if (!years || years.length === 0) {
      const currentYear = new Date().getFullYear().toString();
      years = [currentYear];
    }

    for (const tableInfo of tables) {
      for (const tahun of years) {
        // Pastikan tidak duplikat jika sekolah barusan sudah punya baris (kondisi kemungkinan retried)
        const [existingByYear]: any = await connection.query(
          `SELECT id FROM ${tableInfo.name} WHERE sekolah_id = ? AND tahun = ? LIMIT 1`,
          [sekolahId, tahun]
        );

        if ((existingByYear as any[]).length === 0) {
          await connection.query(
            `INSERT INTO ${tableInfo.name} (sekolah_id, kecamatan_id, nama_sekolah, tahun, ${tableInfo.field}, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [sekolahId, parsedKecamatanId, nama_sekolah.trim(), tahun, 0]
          );
        }
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Data nama sekolah berhasil ditambah dan disinkronkan.',
      data: {
        id: sekolahId,
        kecamatan_id: parsedKecamatanId,
        nama_sekolah: nama_sekolah.trim(),
        status,
      }
    });
  } catch (error: any) {
    console.error('Error POST nama-sekolah:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      await connection.end();
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan ketika menambah data.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (_e) {
        // ignore
      }
    }
  }
}

/**
 * PUT /api/data/nama-sekolah
 * Update data sekolah dasar
 */
export async function PUT(request: NextRequest) {
  let connection: any;
  try {
    const body = await request.json();
    const { id, kecamatan_id, nama_sekolah, status } = body;

    if (!id || !kecamatan_id || !nama_sekolah || !status) {
      return NextResponse.json(
        { success: false, error: 'id, kecamatan_id, nama_sekolah, dan status wajib diisi.' },
        { status: 400 }
      );
    }

    const parsedId = Number(id);
    const parsedKecamatanId = Number(kecamatan_id);

    if (Number.isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, error: 'id harus angka valid.' },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedKecamatanId) || parsedKecamatanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'kecamatan_id harus angka valid.' },
        { status: 400 }
      );
    }

    if (status !== 'Negeri' && status !== 'Swasta') {
      return NextResponse.json(
        { success: false, error: 'status harus Negeri atau Swasta.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // Check if sekolah exists
    const [existingSekolah] = await connection.query(
      'SELECT id FROM sekolah_dasar WHERE id = ?',
      [parsedId]
    );

    if ((existingSekolah as any[]).length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'Sekolah tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check if kecamatan exists
    const [existingKecamatan] = await connection.query(
      'SELECT id FROM kecamatan WHERE id = ?',
      [parsedKecamatanId]
    );

    if ((existingKecamatan as any[]).length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'Kecamatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check if nama_sekolah already exists in same kecamatan (exclude current id)
    const [duplicateName] = await connection.query(
      'SELECT id FROM sekolah_dasar WHERE kecamatan_id = ? AND nama_sekolah = ? AND id != ?',
      [parsedKecamatanId, nama_sekolah.trim(), parsedId]
    );

    if ((duplicateName as any[]).length > 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'Nama sekolah sudah ada di kecamatan ini.' },
        { status: 409 }
      );
    }

    // Update sekolah
    await connection.query(
      'UPDATE sekolah_dasar SET kecamatan_id = ?, nama_sekolah = ?, status = ? WHERE id = ?',
      [parsedKecamatanId, nama_sekolah.trim(), status, parsedId]
    );

    // Update related tables (data_guru_sekolah, data_siswa_sekolah, data_rombel_sekolah)
    const tables = [
      'data_guru_sekolah',
      'data_siswa_sekolah',
      'data_rombel_sekolah',
    ];

    for (const tableName of tables) {
      await connection.query(
        `UPDATE ${tableName} SET kecamatan_id = ?, nama_sekolah = ? WHERE sekolah_id = ?`,
        [parsedKecamatanId, nama_sekolah.trim(), parsedId]
      );
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Data sekolah berhasil diupdate.',
    });
  } catch (error: any) {
    console.error('Error PUT nama-sekolah:', error);
    if (connection) {
      await connection.end();
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan ketika mengupdate data.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data/nama-sekolah
 * Delete data sekolah dasar dan data terkait
 */
export async function DELETE(request: NextRequest) {
  let connection: any;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID tidak ditemukan' },
        { status: 400 }
      );
    }

    const parsedId = Number(id);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID harus angka valid.' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // Check if sekolah exists
    const [existingSekolah] = await connection.query(
      'SELECT id, nama_sekolah FROM sekolah_dasar WHERE id = ?',
      [parsedId]
    );

    if ((existingSekolah as any[]).length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, error: 'Sekolah tidak ditemukan' },
        { status: 404 }
      );
    }

    await connection.beginTransaction();

    // Delete from related tables first
    const tables = [
      'data_guru_sekolah',
      'data_siswa_sekolah',
      'data_rombel_sekolah',
    ];

    for (const tableName of tables) {
      await connection.query(
        `DELETE FROM ${tableName} WHERE sekolah_id = ?`,
        [parsedId]
      );
    }

    // Delete from sekolah_dasar
    await connection.query(
      'DELETE FROM sekolah_dasar WHERE id = ?',
      [parsedId]
    );

    await connection.commit();
    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Data sekolah berhasil dihapus.',
    });
  } catch (error: any) {
    console.error('Error DELETE nama-sekolah:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      await connection.end();
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan ketika menghapus data.' },
      { status: 500 }
    );
  }
}


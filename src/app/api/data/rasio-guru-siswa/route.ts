import { NextResponse, NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db';

/**
 * GET /api/data/rasio-guru-siswa
 * Menampilkan rasio guru:siswa per kecamatan per tahun
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get('tahun');
    const kecamatan = searchParams.get('kecamatan');

    const connection = await getDbConnection();

    const yearsQuery = tahun
      ? 'SELECT DISTINCT tahun FROM view_guru_per_kecamatan WHERE tahun = ? ORDER BY tahun'
      : 'SELECT DISTINCT tahun FROM view_guru_per_kecamatan ORDER BY tahun';
    const [yearRows] = await connection.query(yearsQuery, tahun ? [tahun] : []);

    let rows: any[] = [];

    if ((yearRows as any[]).length === 0) {
      let emptyQuery = `
        SELECT
          k.id AS kecamatan_id,
          k.nama AS kecamatan,
          '-' AS tahun,
          0 AS jumlah_sekolah,
          0 AS total_guru,
          0 AS total_siswa,
          0 AS rasio_guru_siswa
        FROM kecamatan k
        WHERE 1=1
      `;
      const emptyParams: any[] = [];
      if (kecamatan) {
        emptyQuery += ' AND k.nama LIKE ?';
        emptyParams.push(`%${kecamatan}%`);
      }
      emptyQuery += ' ORDER BY k.nama ASC';
      const [emptyRows] = await connection.query(emptyQuery, emptyParams);
      rows = (emptyRows as any[]).map((row, index) => ({ ...row, no: index + 1 }));
    } else {
      let query = `
        SELECT
          k.id AS kecamatan_id,
          k.nama AS kecamatan,
          y.tahun,
          COALESCE(g.jumlah_sekolah, 0) AS jumlah_sekolah,
          COALESCE(g.total_guru, 0) AS total_guru,
          COALESCE(s.total_siswa, 0) AS total_siswa,
          CASE
            WHEN COALESCE(g.total_guru, 0) = 0 THEN 0
            ELSE ROUND(COALESCE(s.total_siswa, 0) / COALESCE(g.total_guru, 0), 2)
          END AS rasio_guru_siswa
        FROM kecamatan k
        CROSS JOIN (
          SELECT DISTINCT tahun
          FROM view_guru_per_kecamatan
          ${tahun ? 'WHERE tahun = ?' : ''}
        ) y
        LEFT JOIN view_guru_per_kecamatan g
          ON g.kecamatan_id = k.id AND g.tahun = y.tahun
        LEFT JOIN view_siswa_per_kecamatan s
          ON s.kecamatan_id = k.id AND s.tahun = y.tahun
        WHERE 1=1
      `;

      const params: any[] = [];
      if (tahun) params.push(tahun);
      if (kecamatan) {
        query += ' AND k.nama LIKE ?';
        params.push(`%${kecamatan}%`);
      }
      query += ' ORDER BY y.tahun DESC, k.nama ASC';

      const [joinedRows] = await connection.query(query, params);
      rows = (joinedRows as any[]).map((row, index) => ({
        ...row,
        no: index + 1,
        tahun: row.tahun && row.tahun !== '-' ? row.tahun.replace('-', '/') : row.tahun,
        rasio_guru_siswa: Number(row.rasio_guru_siswa ?? 0),
      }));
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error: any) {
    console.error('Error rasio-guru-siswa:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

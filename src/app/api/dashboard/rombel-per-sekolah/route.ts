import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    const [rows] = await connection.query(`
      SELECT 
        kecamatan_id,
        kecamatan,
        nama_sekolah,
        tahun,
        jumlah_rombel as jumlahRombel
      FROM view_rombel_per_sekolah
      ORDER BY tahun ASC, jumlah_rombel DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan_id: row.kecamatan_id,
      kecamatan: row.kecamatan,
      nama_sekolah: row.nama_sekolah,
      tahun: row.tahun,
      jumlahRombel: Number(row.jumlahRombel)
    }));

    const totalRombel = data.reduce((sum: number, item: Record<string, unknown>) => sum + (item.jumlahRombel as number), 0);
    const tahun = data[0]?.tahun || new Date().getFullYear();

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        tahun,
        totalRombel,
        detail: data
      }
    });
  } catch (error) {
    console.error('Error fetching rombel per sekolah:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data rombel per sekolah',
      error: String(error)
    }, { status: 500 });
  }
}

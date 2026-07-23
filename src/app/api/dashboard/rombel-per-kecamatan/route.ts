import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    // Get rombel data per kecamatan for ALL years
    const [rows] = await connection.query(`
      SELECT 
        kecamatan,
        jumlah_sekolah as jumlahSekolah,
        total_rombel as jumlahRombel,
        tahun
      FROM view_rombel_per_kecamatan
      ORDER BY tahun ASC, total_rombel DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan: row.kecamatan,
      jumlahSekolah: Number(row.jumlahSekolah),
      jumlahRombel: Number(row.jumlahRombel),
      tahun: row.tahun
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
    console.error('Error fetching rombel per kecamatan:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data rombel per kecamatan',
      error: String(error)
    }, { status: 500 });
  }
}

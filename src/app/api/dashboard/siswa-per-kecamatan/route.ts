import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    // Get siswa data per kecamatan for ALL years
    const [rows] = await connection.query(`
      SELECT 
        kecamatan,
        total_siswa as jumlahSiswa,
        tahun
      FROM view_siswa_per_kecamatan
      ORDER BY tahun ASC, total_siswa DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan: row.kecamatan,
      jumlahSiswa: Number(row.jumlahSiswa),
      tahun: row.tahun
    }));

    const totalSiswa = data.reduce((sum: number, item: Record<string, unknown>) => sum + (item.jumlahSiswa as number), 0);
    const tahun = data[0]?.tahun || new Date().getFullYear();

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        tahun,
        totalSiswa,
        detail: data
      }
    });
  } catch (error) {
    console.error('Error fetching siswa per kecamatan:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data siswa per kecamatan',
      error: String(error)
    }, { status: 500 });
  }
}

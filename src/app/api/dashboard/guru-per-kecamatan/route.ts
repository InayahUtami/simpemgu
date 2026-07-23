import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    // Get guru data per kecamatan for ALL years (order by year ascending so latest is last)
    const [rows] = await connection.query(`
      SELECT 
        kecamatan,
        total_guru as jumlahGuru,
        tahun
      FROM view_guru_per_kecamatan
      ORDER BY tahun ASC, total_guru DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan: row.kecamatan,
      jumlahGuru: Number(row.jumlahGuru),
      tahun: row.tahun
    }));

    const totalGuru = data.reduce((sum: number, item: Record<string, unknown>) => sum + (item.jumlahGuru as number), 0);
    const tahun = data[0]?.tahun || new Date().getFullYear();

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        tahun,
        totalGuru,
        detail: data
      }
    });
  } catch (error) {
    console.error('Error fetching guru per kecamatan:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data guru per kecamatan',
      error: String(error)
    }, { status: 500 });
  }
}

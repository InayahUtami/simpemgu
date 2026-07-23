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
        jumlah_guru as jumlahGuru
      FROM view_guru_per_sekolah
      ORDER BY tahun ASC, jumlah_guru DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan_id: row.kecamatan_id,
      kecamatan: row.kecamatan,
      nama_sekolah: row.nama_sekolah,
      tahun: row.tahun,
      jumlahGuru: Number(row.jumlahGuru)
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
    console.error('Error fetching guru per sekolah:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data guru per sekolah',
      error: String(error)
    }, { status: 500 });
  }
}

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
        jumlah_siswa as jumlahSiswa
      FROM view_siswa_per_sekolah
      ORDER BY tahun ASC, jumlah_siswa DESC
    `) as [Record<string, unknown>[], unknown[]];

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan_id: row.kecamatan_id,
      kecamatan: row.kecamatan,
      nama_sekolah: row.nama_sekolah,
      tahun: row.tahun,
      jumlahSiswa: Number(row.jumlahSiswa)
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
    console.error('Error fetching siswa per sekolah:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data siswa per sekolah',
      error: String(error)
    }, { status: 500 });
  }
}

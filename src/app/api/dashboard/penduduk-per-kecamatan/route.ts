import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    // Get penduduk data per kecamatan for ALL years
    const [rows] = await connection.query(`
      SELECT 
        kecamatan_id,
        tahun,
        jumlah_penduduk as jumlahPenduduk
      FROM jumlah_penduduk
      ORDER BY tahun ASC, jumlah_penduduk DESC
    `) as [Record<string, unknown>[], unknown[]];

    // Get kecamatan names
    const [kecamatanRows] = await connection.query(`
      SELECT id, nama FROM kecamatan
    `) as [Record<string, unknown>[], unknown[]];

    const kecamatanMap: { [key: number]: string } = {};
    kecamatanRows.forEach((row: Record<string, unknown>) => {
      kecamatanMap[row.id as number] = row.nama as string;
    });

    const data = rows.map((row: Record<string, unknown>) => ({
      kecamatan: kecamatanMap[row.kecamatan_id as number] || `Kecamatan ${row.kecamatan_id}`,
      jumlahPenduduk: Number(row.jumlahPenduduk),
      tahun: row.tahun
    }));

    const totalPenduduk = data.reduce((sum: number, item: Record<string, unknown>) => sum + (item.jumlahPenduduk as number), 0);
    const tahun = data[0]?.tahun || new Date().getFullYear();

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        tahun,
        totalPenduduk,
        detail: data
      }
    });
  } catch (error) {
    console.error('Error fetching penduduk per kecamatan:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data penduduk per kecamatan',
      error: String(error)
    }, { status: 500 });
  }
}

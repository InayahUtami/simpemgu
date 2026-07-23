import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getDbConnection();

    // Get total rombel from LATEST YEAR ONLY
    const rombelResult = await connection.query(`
      SELECT COALESCE(SUM(total_rombel), 0) as total,
             tahun
      FROM view_rombel_per_kecamatan
      WHERE tahun = (SELECT MAX(tahun) FROM view_rombel_per_kecamatan)
      GROUP BY tahun
    `) as [Record<string, unknown>[], unknown[]];
    const totalRombel = Number(rombelResult[0]?.[0]?.total) || 0;
    const tahunRombel = rombelResult[0]?.[0]?.tahun || new Date().getFullYear();

    // Get total guru from LATEST YEAR ONLY
    // Try 2025-2026 first, if no data fall back to 2024-2025
    let guruResult = await connection.query(`
      SELECT COALESCE(SUM(total_guru), 0) as total,
             tahun
      FROM view_guru_per_kecamatan
      WHERE tahun = (SELECT MAX(tahun) FROM view_guru_per_kecamatan)
      GROUP BY tahun
    `) as [Record<string, unknown>[], unknown[]];
    let totalGuru = Number(guruResult[0]?.[0]?.total) || 0;
    let tahunGuru = guruResult[0]?.[0]?.tahun || new Date().getFullYear();
    
    // If no data, try previous year
    if (!totalGuru || totalGuru === 0) {
      guruResult = await connection.query(`
        SELECT COALESCE(SUM(total_guru), 0) as total,
               tahun
        FROM view_guru_per_kecamatan
        WHERE tahun = '2024-2025'
        GROUP BY tahun
      `) as [Record<string, unknown>[], unknown[]];
      totalGuru = Number(guruResult[0]?.[0]?.total) || 0;
      tahunGuru = guruResult[0]?.[0]?.tahun || '2024-2025';
    }

    // Get total siswa from LATEST YEAR ONLY
    const siswaResult = await connection.query(`
      SELECT COALESCE(SUM(total_siswa), 0) as total,
             tahun
      FROM view_siswa_per_kecamatan
      WHERE tahun = (SELECT MAX(tahun) FROM view_siswa_per_kecamatan)
      GROUP BY tahun
    `) as [Record<string, unknown>[], unknown[]];
    const totalSiswa = Number(siswaResult[0]?.[0]?.total) || 0;
    const tahunSiswa = siswaResult[0]?.[0]?.tahun || new Date().getFullYear();

    // Get total penduduk from jumlah_penduduk - use 2024 (most complete) rather than 2025
    let pendudukResult = await connection.query(`
      SELECT COALESCE(SUM(jumlah_penduduk), 0) as total,
             tahun
      FROM jumlah_penduduk
      WHERE tahun = 2024
      GROUP BY tahun
    `) as [Record<string, unknown>[], unknown[]];
    let totalPenduduk = Number(pendudukResult[0]?.[0]?.total) || 0;
    let tahunPenduduk = pendudukResult[0]?.[0]?.tahun || 2024;
    
    // If no data in 2024, try latest available
    if (!totalPenduduk || totalPenduduk === 0) {
      pendudukResult = await connection.query(`
        SELECT COALESCE(SUM(jumlah_penduduk), 0) as total,
               tahun
        FROM jumlah_penduduk
        WHERE tahun = (SELECT MAX(tahun) FROM jumlah_penduduk WHERE jumlah_penduduk > 0)
        GROUP BY tahun
      `) as [Record<string, unknown>[], unknown[]];
      totalPenduduk = Number(pendudukResult[0]?.[0]?.total) || 0;
      tahunPenduduk = pendudukResult[0]?.[0]?.tahun || 2024;
    }

    // Get total kecamatan
    const kecamatanResult = await connection.query(`
      SELECT COUNT(*) as total FROM kecamatan
    `) as [Record<string, unknown>[], unknown[]];
    const totalKecamatan = kecamatanResult[0]?.[0]?.total || 0;

    // Count sekolah from sekolah_dasar table
    const sekolahResult = await connection.query(`
      SELECT COUNT(*) as total FROM sekolah_dasar
    `) as [Record<string, unknown>[], unknown[]];
    const totalSekolah = sekolahResult[0]?.[0]?.total || 0;

    await connection.end();

    console.log('Dashboard Stats:', {
      totalSekolah,
      totalRombel,
      tahunRombel,
      totalGuru,
      tahunGuru,
      totalSiswa,
      tahunSiswa,
      totalPenduduk,
      tahunPenduduk
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSekolah,
        totalRombel,
        tahunRombel,
        totalGuru,
        tahunGuru,
        totalSiswa,
        tahunSiswa,
        totalPenduduk,
        tahunPenduduk,
        totalKecamatan
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil statistik dashboard',
      error: String(error)
    }, { status: 500 });
  }
}


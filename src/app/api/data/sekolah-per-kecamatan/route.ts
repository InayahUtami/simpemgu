import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SekolahDetail {
  id: number;
  nama: string;
  jumlahGuru: number;
  jumlahSiswa: number;
  rasioSiswaGuru: number;
  kondisiPemerataan: 'Kelebihan Guru' | 'Seimbang' | 'Kekurangan Guru';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kecamatanId = searchParams.get('kecamatan_id');
    const tahun = searchParams.get('tahun');

    if (!kecamatanId || !tahun) {
      return NextResponse.json(
        { success: false, error: 'Parameter kecamatan_id dan tahun diperlukan' },
        { status: 400 }
      );
    }

    // Fetch detail sekolah per kecamatan dengan data guru dan siswa
    const sekolahList: any = await query(`
      SELECT 
        sd.id,
        sd.nama_sekolah as nama,
        COALESCE(dgs.jumlah_guru, 0) as jumlah_guru,
        COALESCE(dss.jumlah_siswa, 0) as jumlah_siswa
      FROM sekolah_dasar sd
      LEFT JOIN (
        SELECT sekolah_id, SUM(jumlah_guru) as jumlah_guru
        FROM data_guru_sekolah
        WHERE tahun = ? OR tahun LIKE CONCAT(?, '/%') OR tahun LIKE CONCAT(?, '-%') OR tahun LIKE CONCAT('%', ?, '%')
        GROUP BY sekolah_id
      ) dgs ON sd.id = dgs.sekolah_id
      LEFT JOIN (
        SELECT sekolah_id, SUM(jumlah_siswa) as jumlah_siswa
        FROM data_siswa_sekolah
        WHERE tahun = ? OR tahun LIKE CONCAT(?, '/%') OR tahun LIKE CONCAT(?, '-%') OR tahun LIKE CONCAT('%', ?, '%')
        GROUP BY sekolah_id
      ) dss ON sd.id = dss.sekolah_id
      WHERE sd.kecamatan_id = ?
      ORDER BY sd.nama_sekolah ASC
    `, [
      tahun, tahun, tahun, tahun,
      tahun, tahun, tahun, tahun,
      kecamatanId
    ]);

    // Filter dan format data
    const filteredSekolah = sekolahList
      .filter((row: any) => Number(row.jumlah_guru || 0) > 0 && Number(row.jumlah_siswa || 0) > 0)
      .map((row: any) => {
        const jumlahGuru = Number(row.jumlah_guru || 0);
        const jumlahSiswa = Number(row.jumlah_siswa || 0);
        const rasioSiswaGuru = jumlahGuru > 0 ? Number((jumlahSiswa / jumlahGuru).toFixed(2)) : 0;

        // Kategorisasi berbasis rasio 18-20 sebagai seimbang
        let kondisiPemerataan: 'Kelebihan Guru' | 'Seimbang' | 'Kekurangan Guru' = 'Seimbang';
        if (rasioSiswaGuru < 18) {
          kondisiPemerataan = 'Kelebihan Guru';
        } else if (rasioSiswaGuru > 20) {
          kondisiPemerataan = 'Kekurangan Guru';
        }

        return {
          id: row.id,
          nama: row.nama,
          jumlahGuru,
          jumlahSiswa,
          rasioSiswaGuru,
          kondisiPemerataan
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        kecamatanId: parseInt(kecamatanId),
        tahun,
        sekolahList: filteredSekolah,
        totalSekolah: filteredSekolah.length,
        totalGuru: filteredSekolah.reduce((sum: number, s: any) => sum + Number(s.jumlahGuru || 0), 0),
        totalSiswa: filteredSekolah.reduce((sum: number, s: any) => sum + Number(s.jumlahSiswa || 0), 0)
      }
    });
  } catch (error: any) {
    console.error('Error fetching sekolah details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

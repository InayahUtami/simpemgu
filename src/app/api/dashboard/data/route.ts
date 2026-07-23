import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type DashboardGroupedRow = {
  [key: string]: unknown;
  dataByYear: Record<string, Record<string, number>>;
};

export async function GET() {
  try {
    // Fetch all kecamatan data
    const kecamatanList = await query(`
      SELECT id, nomor, nama 
      FROM kecamatan 
      ORDER BY nomor ASC
    `);

    // Fetch jumlah penduduk data
    const jumlahPendudukResults = await query(`
      SELECT 
        k.id,
        k.nomor,
        k.nama as kecamatan,
        jp.tahun,
        COALESCE(jp.jumlah_penduduk, 0) as jumlah_penduduk
      FROM kecamatan k
      LEFT JOIN jumlah_penduduk jp ON k.id = jp.kecamatan_id
      ORDER BY k.nomor ASC, jp.tahun ASC
    `);

    // Fetch luas wilayah data
    const luasWilayahResults = await query(`
      SELECT 
        k.id,
        k.nomor,
        k.nama as kecamatan,
        lw.tahun,
        COALESCE(lw.luas_wilayah, 0) as luas_wilayah
      FROM kecamatan k
      LEFT JOIN luas_wilayah_kecamatan lw ON k.id = lw.kecamatan_id
      ORDER BY k.nomor ASC, lw.tahun ASC
    `);

    // Fetch kelahiran data
    const kelahiranResults = await query(`
      SELECT 
        k.id as kecamatan_id,
        k.nama as kecamatan,
        kl.tahun,
        COALESCE(kl.jumlah_kelahiran, 0) as kelahiran
      FROM kecamatan k
      LEFT JOIN kelahiran kl ON k.id = kl.kecamatan_id
      ORDER BY k.nama, kl.tahun
    `);

    // Fetch kematian data
    const kematianResults = await query(`
      SELECT 
        k.id as kecamatan_id,
        k.nama as kecamatan,
        km.tahun,
        COALESCE(km.jumlah_kematian, 0) as kematian
      FROM kecamatan k
      LEFT JOIN kematian km ON k.id = km.kecamatan_id
      ORDER BY k.nama, km.tahun
    `);

    // Fetch migrasi data
    const migrasiResults = await query(`
      SELECT 
        k.nama as kecamatan,
        m.tahun,
        COALESCE(m.migrasi_masuk, 0) as masuk,
        COALESCE(m.migrasi_keluar, 0) as keluar,
        COALESCE(m.migrasi_netto, 0) as netto
      FROM kecamatan k
      LEFT JOIN migrasi m ON k.id = m.kecamatan_id
      ORDER BY k.nama, m.tahun
    `);

    // Fetch jumlah penduduk disdukcapil
    const jumlahPendudukDisdukcapilResults = await query(`
      SELECT 
        k.nama as kecamatan,
        jpd.tahun,
        COALESCE(jpd.jumlah_penduduk, 0) as jumlah_penduduk_disdukcapil
      FROM kecamatan k
      LEFT JOIN jumlah_penduduk_disdukcapil jpd ON k.id = jpd.kecamatan_id
      ORDER BY k.nama, jpd.tahun
    `);

    // Transform jumlah penduduk to nested format
    const jumlahPendudukGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      jumlahPendudukGrouped[kec.nama as string] = {
        id: kec.id,
        nomor: kec.nomor,
        kecamatan: kec.nama,
        dataByYear: {}
      };
    });
    jumlahPendudukResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null) {
        jumlahPendudukGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          jumlahPenduduk: parseInt(row.jumlah_penduduk as string) || 0
        };
      }
    });

    // Transform luas wilayah to nested format
    const luasWilayahGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      luasWilayahGrouped[kec.nama as string] = {
        id: kec.id,
        nomor: kec.nomor,
        kecamatan: kec.nama,
        dataByYear: {}
      };
    });
    luasWilayahResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null) {
        luasWilayahGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          luasWilayah: parseFloat(row.luas_wilayah as string) || 0
        };
      }
    });

    // Transform kelahiran to nested format
    const kelahiranGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      kelahiranGrouped[kec.nama as string] = {
        kecamatan: kec.nama,
        kecamatanId: kec.id,
        dataByYear: {}
      };
    });
    kelahiranResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null) {
        kelahiranGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          kelahiran: parseInt(row.kelahiran as string) || 0
        };
      }
    });

    // Transform kematian to nested format
    const kematianGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      kematianGrouped[kec.nama as string] = {
        kecamatan: kec.nama,
        kecamatanId: kec.id,
        dataByYear: {}
      };
    });
    kematianResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null) {
        kematianGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          kematian: parseInt(row.kematian as string) || 0
        };
      }
    });

    // Transform migrasi to nested format
    const migrasiGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      migrasiGrouped[kec.nama as string] = {
        kecamatan: kec.nama,
        dataByYear: {}
      };
    });
    migrasiResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null && migrasiGrouped[row.kecamatan as string]) {
        migrasiGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          masuk: parseInt(row.masuk as string) || 0,
          keluar: parseInt(row.keluar as string) || 0,
          netto: parseInt(row.netto as string) || 0
        };
      }
    });

    // Transform jumlah penduduk disdukcapil to nested format
    const jumlahPendudukDisdukcapilGrouped: Record<string, DashboardGroupedRow> = {};
    kecamatanList.forEach((kec: Record<string, unknown>) => {
      jumlahPendudukDisdukcapilGrouped[kec.nama as string] = {
        kecamatan: kec.nama,
        dataByYear: {}
      };
    });
    jumlahPendudukDisdukcapilResults.forEach((row: Record<string, unknown>) => {
      if (row.tahun !== null && jumlahPendudukDisdukcapilGrouped[row.kecamatan as string]) {
        jumlahPendudukDisdukcapilGrouped[row.kecamatan as string].dataByYear[row.tahun as string] = {
          jumlahPendudukDisdukcapil: parseInt(row.jumlah_penduduk_disdukcapil as string) || 0
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        kecamatan: kecamatanList,
        jumlahPenduduk: Object.values(jumlahPendudukGrouped),
        luasWilayah: Object.values(luasWilayahGrouped),
        kelahiran: Object.values(kelahiranGrouped),
        kematian: Object.values(kematianGrouped),
        migrasi: Object.values(migrasiGrouped),
        jumlahPendudukDisdukcapil: Object.values(jumlahPendudukDisdukcapilGrouped)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data dashboard',
      error: String(error)
    }, { status: 500 });
  }
}



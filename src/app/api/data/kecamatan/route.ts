import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getDbConnection } from '@/lib/db';

const databaseName = process.env.DB_NAME || process.env.DB_DATABASE;

// GET - Ambil semua data kecamatan
export async function GET() {
  let connection;
  try {
    console.log('Attempting to connect to database...');
    connection = await getDbConnection();
    console.log('Database connected successfully');
    
    console.log('Executing query: SELECT * FROM kecamatan ORDER BY nomor ASC');
    const [rows] = await connection.execute(
      'SELECT * FROM kecamatan ORDER BY nomor ASC'
    );
    console.log(`Query successful, found ${(rows as any[]).length} rows`);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('=== ERROR FETCHING KECAMATAN ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL message:', error.sqlMessage);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      code: error.code,
      sqlMessage: error.sqlMessage
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// POST - Tambah data kecamatan baru
export async function POST(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const body = await request.json();
    const { nama } = body;
    
    connection = await getDbConnection();

    const tableExists = async (tableName: string): Promise<boolean> => {
      const [rows]: any = await connection!.execute(
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = ? AND table_name = ?`,
         [databaseName, tableName]
      );
      return Number(rows[0]?.count || 0) > 0;
    };
    
    // Start transaction
    await connection.beginTransaction();
    
    // Cek duplikat nama
    const [existing]: any = await connection.execute(
      'SELECT id FROM kecamatan WHERE nama = ?',
      [nama]
    );
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Data sudah ada, tidak boleh duplikat!'
      }, { status: 400 });
    }
    
    // Dapatkan nomor urut berikutnya
    const [maxNomor]: any = await connection.execute(
      'SELECT MAX(nomor) as maxNomor FROM kecamatan'
    );
    const nextNomor = (maxNomor[0]?.maxNomor || 0) + 1;
    
    // Insert data baru ke tabel kecamatan
    const [result]: any = await connection.execute(
      'INSERT INTO kecamatan (nomor, nama) VALUES (?, ?)',
      [nextNomor, nama]
    );
    
    const newKecamatanId = result.insertId;
    
    let existingYears: any[] = [];
    let existingLuasYears: any[] = [];
    let kelahiranYears: any[] = [];
    let kematianYears: any[] = [];
    let migrasiYears: any[] = [];
    let disdukcapilYears: any[] = [];

    if (await tableExists('jumlah_penduduk')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM jumlah_penduduk ORDER BY tahun');
      existingYears = rows;
      if (existingYears.length > 0) {
        await Promise.all(
          existingYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO jumlah_penduduk (kecamatan_id, tahun, jumlah_penduduk, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }

    if (await tableExists('luas_wilayah_kecamatan')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM luas_wilayah_kecamatan ORDER BY tahun');
      existingLuasYears = rows;
      if (existingLuasYears.length > 0) {
        await Promise.all(
          existingLuasYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO luas_wilayah_kecamatan (kecamatan_id, tahun, luas_wilayah, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }

    if (await tableExists('kelahiran')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM kelahiran ORDER BY tahun');
      kelahiranYears = rows;
      if (kelahiranYears.length > 0) {
        await Promise.all(
          kelahiranYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO kelahiran (kecamatan_id, tahun, jumlah_kelahiran, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }

    if (await tableExists('kematian')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM kematian ORDER BY tahun');
      kematianYears = rows;
      if (kematianYears.length > 0) {
        await Promise.all(
          kematianYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO kematian (kecamatan_id, tahun, jumlah_kematian, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }

    if (await tableExists('migrasi')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM migrasi ORDER BY tahun');
      migrasiYears = rows;
      if (migrasiYears.length > 0) {
        await Promise.all(
          migrasiYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO migrasi (kecamatan_id, tahun, migrasi_masuk, migrasi_keluar, created_at, updated_at) VALUES (?, ?, 0, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }

    if (await tableExists('jumlah_penduduk_disdukcapil')) {
      const [rows]: any = await connection.execute('SELECT DISTINCT tahun FROM jumlah_penduduk_disdukcapil ORDER BY tahun');
      disdukcapilYears = rows;
      if (disdukcapilYears.length > 0) {
        await Promise.all(
          disdukcapilYears.map((row: any) =>
            connection!.execute(
              'INSERT INTO jumlah_penduduk_disdukcapil (kecamatan_id, tahun, jumlah_penduduk, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())',
              [newKecamatanId, row.tahun]
            )
          )
        );
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    console.log(`✅ Kecamatan baru "${nama}" ditambahkan dengan:`);
    console.log(`   - ${existingYears.length} tahun di jumlah_penduduk`);
    console.log(`   - ${existingLuasYears.length} tahun di luas_wilayah_kecamatan`);
    console.log(`   - ${kelahiranYears.length} tahun di kelahiran`);
    console.log(`   - ${kematianYears.length} tahun di kematian`);
    console.log(`   - ${migrasiYears.length} tahun di migrasi`);
    console.log(`   - ${disdukcapilYears.length} tahun di jumlah_penduduk_disdukcapil`);
    
    return NextResponse.json({
      success: true,
      message: 'Data berhasil ditambah dan disinkronkan ke semua tabel!',
      id: newKecamatanId,
      yearsAdded: {
        jumlah_penduduk: existingYears.length,
        luas_wilayah: existingLuasYears.length,
        kelahiran: kelahiranYears.length,
        kematian: kematianYears.length,
        migrasi: migrasiYears.length,
        disdukcapil: disdukcapilYears.length
      }
    });
  } catch (error: any) {
    // Rollback on error
    if (connection) {
      await connection.rollback();
    }
    console.error('Error adding kecamatan:', error);
    return NextResponse.json({
      success: false,
      error: error.sqlMessage || error.message || 'Terjadi kesalahan saat menambah kecamatan'
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT - Update data kecamatan
export async function PUT(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { id, nama } = body;
    
    connection = await getDbConnection();
    
    // Cek duplikat nama (exclude current id)
    const [existing]: any = await connection.execute(
      'SELECT id FROM kecamatan WHERE nama = ? AND id != ?',
      [nama, id]
    );
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Data sudah ada, tidak boleh duplikat!'
      }, { status: 400 });
    }
    
    // Update data
    await connection.execute(
      'UPDATE kecamatan SET nama = ? WHERE id = ?',
      [nama, id]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Data berhasil diupdate!'
    });
  } catch (error: any) {
    console.error('Error updating kecamatan:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE - Hapus data kecamatan beserta data sekolah terkait
export async function DELETE(request: NextRequest) {
  let connection: mysql.Connection | undefined;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID tidak ditemukan'
      }, { status: 400 });
    }
    
    connection = await getDbConnection();

    const tableExists = async (tableName: string): Promise<boolean> => {
      const [rows]: any = await connection!.execute(
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = ? AND table_name = ?`,
         [databaseName, tableName]
      );
      return Number(rows[0]?.count || 0) > 0;
    };

    await connection.beginTransaction();

    // Cek dulu apakah kecamatan ada
    const [existing]: any = await connection.execute(
      'SELECT id, nama FROM kecamatan WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return NextResponse.json({
        success: false,
        error: 'Data kecamatan tidak ditemukan'
      }, { status: 404 });
    }

    // Beberapa tabel sekolah belum ON DELETE CASCADE ke kecamatan,
    // jadi hapus child rows terlebih dulu agar tidak kena FK constraint.
    const dependentTables = [
      'data_guru_sekolah',
      'data_siswa_sekolah',
      'data_rombel_sekolah',
      'sekolah_dasar'
    ];

    for (const tableName of dependentTables) {
      if (await tableExists(tableName)) {
        await connection.execute(`DELETE FROM ${tableName} WHERE kecamatan_id = ?`, [id]);
      }
    }

    await connection.execute('DELETE FROM kecamatan WHERE id = ?', [id]);

    await connection.commit();
    
    return NextResponse.json({
      success: true,
      message: 'Data kecamatan dan semua data terkait berhasil dihapus!'
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting kecamatan:', error);
    return NextResponse.json({
      success: false,
      error: error.code === 'ER_ROW_IS_REFERENCED_2'
        ? 'Data kecamatan masih dipakai tabel lain. Hapus relasi datanya terlebih dulu.'
        : error.message
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}


import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper function to format number with dot separator
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export async function GET() {
  try {
    // Fetch all kecamatan first
    const kecamatanList = await query(`
      SELECT id, nomor, nama 
      FROM kecamatan 
      ORDER BY nomor ASC
    `);

    // Fetch all population data
    const results = await query(`
      SELECT 
        k.id,
        k.nomor,
        k.nama as kecamatan,
        jp.tahun,
        COALESCE(jp.jumlah_penduduk, 0) as total
      FROM kecamatan k
      LEFT JOIN jumlah_penduduk jp ON k.id = jp.kecamatan_id
      ORDER BY k.nomor ASC, jp.tahun ASC
    `);

    // Transform to nested format
    const grouped: { [kecamatan: string]: any } = {};
    
    // Initialize all kecamatan first (even without data)
    kecamatanList.forEach((kec: any) => {
      grouped[kec.nama] = {
        id: kec.id,
        nomor: kec.nomor,
        kecamatan: kec.nama,
        dataByYear: {}
      };
    });

    // Add population data with formatted numbers
    results.forEach((row: any) => {
      if (row.tahun !== null) {
        grouped[row.kecamatan].dataByYear[row.tahun] = {
          total: formatNumber(row.total) // Format dengan dot separator
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error fetching jumlah penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kecamatanId, tahun, jumlahPenduduk } = body;

    // Check if data already exists
    const existing = await query(
      'SELECT id FROM jumlah_penduduk WHERE kecamatan_id = ? AND tahun = ?',
      [kecamatanId, tahun]
    );

    if (existing.length > 0) {
      // Update existing data
      await query(
        `UPDATE jumlah_penduduk 
         SET jumlah_penduduk = ?, updated_at = NOW() 
         WHERE kecamatan_id = ? AND tahun = ?`,
        [jumlahPenduduk, kecamatanId, tahun]
      );
    } else {
      // Insert new data
      await query(
        `INSERT INTO jumlah_penduduk (kecamatan_id, tahun, jumlah_penduduk, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [kecamatanId, tahun, jumlahPenduduk]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil disimpan'
    });
  } catch (error) {
    console.error('Error saving jumlah penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body; // Array of {kecamatanId, tahun, jumlahPenduduk}

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Batch update
    for (const update of updates) {
      const { kecamatanId, tahun, jumlahPenduduk } = update;
      
      // Check if exists
      const existing = await query(
        'SELECT id FROM jumlah_penduduk WHERE kecamatan_id = ? AND tahun = ?',
        [kecamatanId, tahun]
      );

      if (existing.length > 0) {
        // Update
        await query(
          `UPDATE jumlah_penduduk 
           SET jumlah_penduduk = ?, updated_at = NOW() 
           WHERE kecamatan_id = ? AND tahun = ?`,
          [jumlahPenduduk, kecamatanId, tahun]
        );
      } else {
        // Insert
        await query(
          `INSERT INTO jumlah_penduduk (kecamatan_id, tahun, jumlah_penduduk, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [kecamatanId, tahun, jumlahPenduduk]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating jumlah penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');

    if (!tahun) {
      return NextResponse.json(
        { success: false, error: 'Tahun is required' },
        { status: 400 }
      );
    }

    // Delete all data for this year
    await query(
      'DELETE FROM jumlah_penduduk WHERE tahun = ?',
      [parseInt(tahun)]
    );

    return NextResponse.json({
      success: true,
      message: `Data tahun ${tahun} berhasil dihapus`
    });
  } catch (error) {
    console.error('Error deleting jumlah penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}


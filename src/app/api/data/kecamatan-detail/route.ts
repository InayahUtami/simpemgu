import { NextResponse, NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db';

/**
 * GET /api/data/kecamatan-detail
 * Menampilkan detail satu kecamatan berdasarkan ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    const [rows] = await connection.query(
      `SELECT id, nama FROM kecamatan WHERE id = ? LIMIT 1`,
      [id]
    );

    await connection.end();

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kecamatan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (rows as any[])[0]
    });
  } catch (error) {
    console.error('Error fetching kecamatan detail:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch kecamatan detail' },
      { status: 500 }
    );
  }
}

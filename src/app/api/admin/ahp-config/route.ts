import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Initialize connection pool
let pool: any = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { weights } = body;

    // Validate input
    if (!weights) {
      return NextResponse.json(
        { success: false, message: 'Invalid input: weights diperlukan' },
        { status: 400 }
      );
    }

    // Validate weights object
    const requiredWeights = ['penduduk', 'guru', 'siswa', 'rombel', 'rasio'];
    for (const key of requiredWeights) {
      if (typeof weights[key] !== 'number' || weights[key] <= 0) {
        return NextResponse.json(
          { success: false, message: `Invalid weight untuk ${key}` },
          { status: 400 }
        );
      }
    }

    // Note: scale removed from payload; backend ignores any scale value

    // Get database connection
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      const values = [
        weights.penduduk,
        weights.guru,
        weights.siswa,
        weights.rombel,
        weights.rasio
      ];

      await connection.beginTransaction();

      // Keep one active snapshot only so refresh always loads the newest config.
      await connection.execute(`UPDATE pembobotan_ahp SET is_active = FALSE WHERE is_active = TRUE`);

      const insertQuery = `
        INSERT INTO pembobotan_ahp 
        (penduduk, guru, siswa, rombel, rasio, is_active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `;
      await connection.execute(insertQuery, values);

      await connection.commit();

      // Return success response (no DB read payload)
      return NextResponse.json(
        {
          success: true,
          message: 'Pembobotan AHP berhasil disimpan!'
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving AHP config:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal menyimpan konfigurasi AHP ke database',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT penduduk, guru, siswa, rombel, rasio, updated_at FROM pembobotan_ahp WHERE is_active = TRUE ORDER BY updated_at DESC, id DESC LIMIT 1`
      );

      const result = Array.isArray(rows) && (rows as any[]).length > 0 ? (rows as any[])[0] : null;

      if (!result) {
        return NextResponse.json({ success: true, data: null }, { status: 200 });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            penduduk: Number(result.penduduk),
            guru: Number(result.guru),
            siswa: Number(result.siswa),
            rombel: Number(result.rombel),
            rasio: Number(result.rasio),
            updated_at: result.updated_at
          }
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error fetching AHP config:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil konfigurasi AHP', error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

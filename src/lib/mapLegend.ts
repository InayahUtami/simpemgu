import { getDbConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type MapLegend = {
  id?: number;
  text: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
};

async function resolveMapLegendTable(conn: any) {
  const [currentSchemaRows] = await conn.query(
    `SELECT COUNT(*) as cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'map_legend'`
  );

  if (Number(currentSchemaRows[0]?.cnt || 0) === 1) {
    return 'map_legend';
  }

  const [legacySchemaRows] = await conn.query(
    `SELECT COUNT(*) as cnt
     FROM information_schema.tables
     WHERE table_schema = 'bpsplg'
       AND table_name = 'map_legend'`
  );

  if (Number(legacySchemaRows[0]?.cnt || 0) === 1) {
    return 'bpsplg.map_legend';
  }

  throw new Error('Tabel map_legend tidak ditemukan di schema aktif maupun bpsplg');
}

export async function getMapLegend(): Promise<MapLegend | null> {
  const conn = await getDbConnection();
  try {
    const mapLegendTable = await resolveMapLegendTable(conn);
    const [legends] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM ${mapLegendTable} ORDER BY updated_at DESC LIMIT 1`
    );
    return (legends[0] as MapLegend) || null;
  } finally {
    await conn.end();
  }
}

export async function createMapLegend(data: { text: string; color: string }): Promise<MapLegend> {
  const conn = await getDbConnection();
  try {
    const mapLegendTable = await resolveMapLegendTable(conn);
    await conn.query<ResultSetHeader>(
      `INSERT INTO ${mapLegendTable} (text, color, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
      [data.text, data.color]
    );
    return {
      text: data.text,
      color: data.color,
    };
  } finally {
    await conn.end();
  }
}

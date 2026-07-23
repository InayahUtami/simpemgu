import mysql from "mysql2/promise";

export async function getDbConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME || process.env.DB_DATABASE!,
    // ssl: {
    //   rejectUnauthorized: true,
    // },
  });

  return connection;
}

export type ResultSetHeader = mysql.ResultSetHeader;
export type RowDataPacket = mysql.RowDataPacket;

// Helper function untuk query database
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const connection = await getDbConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results as T[];
  } finally {
    await connection.end();
  }
}

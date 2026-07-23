const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ahc1',
  });

  try {
    // Ambil semua tahun yang ada di salah satu data_* tabel
    const [yearRows] = await connection.query(`
      SELECT DISTINCT tahun FROM (
        SELECT tahun FROM data_guru_sekolah
        UNION
        SELECT tahun FROM data_siswa_sekolah
        UNION
        SELECT tahun FROM data_rombel_sekolah
      ) AS all_years
      ORDER BY tahun ASC
    `);

    const years = yearRows.map((r) => r.tahun);
    if (years.length === 0) {
      console.log('Tidak ditemukan tahun pada data_* (table kosong). Tidak ada yang di-backfill.');
      return;
    }

    console.log('Tahun yang akan di-backfill:', years);

    const [sekolahRows] = await connection.query('SELECT id, kecamatan_id, nama_sekolah FROM sekolah_dasar');

    const tables = [
      { name: 'data_guru_sekolah', field: 'jumlah_guru' },
      { name: 'data_siswa_sekolah', field: 'jumlah_siswa' },
      { name: 'data_rombel_sekolah', field: 'jumlah_rombel' },
    ];

    let inserted = 0;

    for (const sekolah of sekolahRows) {
      for (const table of tables) {
        for (const tahun of years) {
          const [exists] = await connection.query(
            `SELECT id FROM ${table.name} WHERE sekolah_id = ? AND tahun = ? LIMIT 1`,
            [sekolah.id, tahun]
          );

          if ((exists || []).length === 0) {
            await connection.query(
              `INSERT INTO ${table.name} (sekolah_id, kecamatan_id, nama_sekolah, tahun, ${table.field}, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
              [sekolah.id, sekolah.kecamatan_id, sekolah.nama_sekolah, tahun, 0]
            );
            inserted += 1;
          }
        }
      }
    }

    console.log(`Selesai backfill. Total baris baru: ${inserted}`);
  } catch (e) {
    console.error('Gagal backfill', e);
  } finally {
    await connection.end();
  }
}

main();

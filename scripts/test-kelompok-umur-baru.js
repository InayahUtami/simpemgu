const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ahc1'
  });

  try {
    console.log('Test: Menambah kelompok umur baru "100+"');
    
    // Insert kelompok umur baru
    await conn.execute('INSERT INTO kelompok_umur (nama) VALUES (?)', ['100+']);
    
    const [ku] = await conn.execute('SELECT id FROM kelompok_umur WHERE nama = ?', ['100+']);
    const id = ku[0].id;
    console.log('ID kelompok umur 100+:', id);
    
    // Ambil semua tahun yang ada
    const [tahuns] = await conn.execute('SELECT DISTINCT tahun FROM jumlah_penduduk_umurjk ORDER BY tahun');
    console.log('Tahun yang ada:', tahuns.map(t => t.tahun));
    
    // Generate data kosong untuk semua tahun
    for (const t of tahuns) {
      await conn.execute(
        'INSERT INTO jumlah_penduduk_umurjk (id_kelompokumur, tahun, laki_laki, perempuan, jumlah) VALUES (?, ?, 0, 0, 0)',
        [id, t.tahun]
      );
    }
    
    console.log('✓ Data berhasil ditambahkan untuk semua tahun');
    
    // Cek hasilnya
    const [check] = await conn.execute('SELECT * FROM jumlah_penduduk_umurjk WHERE id_kelompokumur = ?', [id]);
    console.table(check);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
})();

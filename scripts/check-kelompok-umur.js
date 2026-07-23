const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ahc1'
  });

  try {
    // Cek kelompok umur 100+
    const [ku] = await conn.execute('SELECT id, nama FROM kelompok_umur WHERE nama = ?', ['100+']);
    
    if (ku.length > 0) {
      console.log('Kelompok umur 100+ ditemukan:');
      console.table(ku);
      
      // Cek data di jumlah_penduduk_umurjk
      const [data] = await conn.execute('SELECT * FROM jumlah_penduduk_umurjk WHERE id_kelompokumur = ?', [ku[0].id]);
      console.log('\nData di jumlah_penduduk_umurjk untuk kelompok umur 100+:');
      if (data.length > 0) {
        console.table(data);
      } else {
        console.log('Tidak ada data di jumlah_penduduk_umurjk untuk kelompok umur ini.');
        console.log('\nMenambahkan data untuk semua tahun...');
        
        // Ambil semua tahun
        const [tahuns] = await conn.execute('SELECT DISTINCT tahun FROM jumlah_penduduk_umurjk ORDER BY tahun');
        
        for (const t of tahuns) {
          await conn.execute(
            'INSERT INTO jumlah_penduduk_umurjk (id_kelompokumur, tahun, laki_laki, perempuan, jumlah) VALUES (?, ?, 0, 0, 0)',
            [ku[0].id, t.tahun]
          );
        }
        
        console.log('✓ Data berhasil ditambahkan untuk', tahuns.length, 'tahun');
        
        // Cek lagi
        const [dataNew] = await conn.execute('SELECT * FROM jumlah_penduduk_umurjk WHERE id_kelompokumur = ?', [ku[0].id]);
        console.table(dataNew);
      }
    } else {
      console.log('Kelompok umur 100+ tidak ditemukan di tabel kelompok_umur');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
})();

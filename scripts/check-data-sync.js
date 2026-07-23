const mysql = require('mysql2/promise');
(async () => {
  try {
    const c = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'ahc1'});
    const [s] = await c.query("SELECT id,kecamatan_id,nama_sekolah,status FROM sekolah_dasar WHERE nama_sekolah='sd 3 tab' ORDER BY id DESC LIMIT 1");
    console.log('sekolah', s);
    if (s.length) {
      const id = s[0].id;
      for (const t of ['data_guru_sekolah','data_siswa_sekolah','data_rombel_sekolah']) {
        const field = t === 'data_guru_sekolah' ? 'jumlah_guru' : t === 'data_siswa_sekolah' ? 'jumlah_siswa' : 'jumlah_rombel';
        const [rows] = await c.query(`SELECT id,sekolah_id,kecamatan_id,nama_sekolah,tahun,${field} FROM ${t} WHERE sekolah_id=? ORDER BY tahun`, [id]);
        console.log(t, rows.length, rows.slice(0, 10));
      }
    }
    await c.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

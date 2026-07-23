const http = require('http');

console.log('Verifying page on port 3004...\n');

http.get('http://localhost:3004/admin/data-nama-sekolah', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response size: ${data.length} bytes`);
    
    if (res.statusCode === 200 && data.length > 1000) {
      console.log('\n✓ Halaman "Data Nama Sekolah" sudah BERHASIL dimuat!');
      console.log('✓ URL: http://localhost:3004/admin/data-nama-sekolah');
      
      // Check for content
      if (data.includes('Data Nama Sekolah') || data.includes('nama-sekolah')) {
        console.log('✓ Konten halaman terdeteksi');
      }
    } else {
      console.log('\n✗ Masih ada masalah dengan page');
    }
  });
}).on('error', err => {
  console.log('✗ Error:', err.message);
  console.log('\nKemungkinan: Server Next.js belum siap');
  console.log('Tunggu beberapa detik dan coba lagi');
});

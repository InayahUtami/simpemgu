const http = require('http');

const pages = [
  '/admin/data/data-guru',
  '/admin/data/data-siswa',
  '/admin/data/data-rombel',
  '/admin/data/data-nama-sekolah',
  '/admin/data/jumlah-penduduk',
  '/admin/dashboard',
  '/admin/per-kecamatan',
  '/dashboard'
];

async function testPage(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3004${path}`, res => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve({ path, status: res.statusCode });
      });
    }).on('error', err => {
      resolve({ path, status: 'ERROR', error: err.message });
    });
  });
}

(async () => {
  console.log('Testing pages on http://localhost:3004...\n');
  
  const results = await Promise.all(pages.map(testPage));
  
  let allGood = true;
  results.forEach(result => {
    const icon = result.status === 200 ? '✓' : '✗';
    console.log(`${icon} ${result.path.padEnd(40)} ${result.status}`);
    if (result.status !== 200) allGood = false;
  });
  
  console.log('\n' + (allGood ? '✓ All pages working!' : '⚠️  Some pages have errors'));
})();

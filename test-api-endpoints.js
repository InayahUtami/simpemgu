const http = require('http');

// Test all API endpoints
const apis = [
  '/api/data/guru-per-kecamatan',
  '/api/data/siswa-per-kecamatan',
  '/api/data/rombel-per-kecamatan',
  '/api/data/guru-per-sekolah',
  '/api/data/siswa-per-sekolah',
  '/api/data/rombel-per-sekolah',
  '/api/data/kecamatan',
  '/api/data/nama-sekolah',
  '/api/data/jumlah-penduduk',
  '/api/data/luas-wilayah-kecamatan',
  '/api/data/kelompok-umur',
  '/api/data/penduduk-kelompok-umur-jk',
  '/api/dashboard/stats',
  '/api/dashboard/data'
];

async function testAPI(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3004${path}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check if response is valid JSON
        let isJSON = false;
        let error = '';
        try {
          JSON.parse(data);
          isJSON = true;
        } catch (e) {
          error = e.message.substring(0, 50);
          // Check if it's HTML
          if (data.includes('<!DOCTYPE')) {
            error = 'HTML response (likely error page)';
          } else if (data.includes('<html')) {
            error = 'HTML response';
          } else if (data.substring(0, 100).includes('Error')) {
            error = data.substring(0, 80);
          }
        }
        
        resolve({
          path,
          status: res.statusCode,
          isJSON,
          error,
          contentType: res.headers['content-type'],
          length: data.length
        });
      });
    }).on('error', err => {
      resolve({
        path,
        status: 'ERROR',
        error: err.message,
        isJSON: false
      });
    });
  });
}

(async () => {
  console.log('Testing all APIs...\n');
  
  const results = await Promise.all(apis.map(testAPI));
  
  results.forEach(result => {
    const icon = result.isJSON && result.status === 200 ? '✓' : '✗';
    const status = result.status === 200 ? '200' : result.status;
    console.log(`${icon} ${result.path.padEnd(40)} ${status.toString().padEnd(6)} ${result.isJSON ? '(JSON)' : result.error}`);
  });
  
  const broken = results.filter(r => !r.isJSON || r.status !== 200);
  console.log(`\n${broken.length} API(s) have issues${broken.length > 0 ? ':' : ''}`);
  broken.forEach(r => {
    console.log(`  - ${r.path}`);
    if (r.error) console.log(`    Error: ${r.error}`);
  });
})();

const http = require('http');

const req = http.get('http://localhost:3003/api/dashboard/guru-per-kecamatan', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success && json.data.detail) {
        const years = [...new Set(json.data.detail.map(d => d.tahun))].sort();
        console.log('Years found:', years);
        console.log('Total records:', json.data.detail.length);
        console.log('Sample records:');
        json.data.detail.slice(0, 3).forEach(d => {
          const year = typeof d.tahun === 'string' ? parseInt(d.tahun.split('-')[0]) : d.tahun;
          console.log(`  ${d.kecamatan} - year:${d.tahun} extracted:${year}`);
        });
      }
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));


// Test the data-guru page for errors
const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3004${path}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data.substring(0, 1500) });
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('Testing /admin/data/data-guru...');
    const page = await testEndpoint('/admin/data/data-guru');
    console.log('Page status:', page.status);
    
    if (page.status === 200) {
      if (page.data.includes('error') || page.data.includes('Error') || page.data.includes('500')) {
        console.log('Found error in page HTML:');
        const regex = /error[^<]*/gi;
        const matches = page.data.match(regex);
        if (matches) matches.slice(0, 3).forEach(m => console.log('  -', m.substring(0, 100)));
      } else {
        console.log('✓ Page loaded successfully');
      }
    }

    console.log('\nTesting /api/data/guru-per-kecamatan...');
    const api = await testEndpoint('/api/data/guru-per-kecamatan');
    console.log('API status:', api.status);
    
    if (api.status === 200) {
      try {
        const json = JSON.parse(api.data);
        console.log('✓ API returned:', json.success ? 'SUCCESS' : 'FAILED');
        if (json.data) console.log('  Rows:', json.data.length);
      } catch (e) {
        console.log('  Could not parse JSON');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();

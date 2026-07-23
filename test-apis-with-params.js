const http = require('http');

// Get kecamatan_id first
const getKecamatanId = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/data/kecamatan', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            resolve(json.data[0].id);
          } else {
            resolve(6); // fallback
          }
        } catch (e) {
          resolve(6); // fallback
        }
      });
    }).on('error', () => resolve(6));
  });
};

// Test APIs with required parameters
async function testAPI(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3004${path}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let isJSON = false;
        let error = '';
        try {
          JSON.parse(data);
          isJSON = true;
        } catch (e) {
          error = e.message.substring(0, 50);
        }
        
        resolve({
          path,
          status: res.statusCode,
          isJSON,
          error
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
  const kecId = await getKecamatanId();
  console.log(`Testing APIs with kecamatan_id=${kecId}...\n`);
  
  const apisWithParams = [
    `/api/data/guru-per-sekolah?kecamatan_id=${kecId}`,
    `/api/data/siswa-per-sekolah?kecamatan_id=${kecId}`,
    `/api/data/rombel-per-sekolah?kecamatan_id=${kecId}`
  ];

  const results = await Promise.all(apisWithParams.map(testAPI));
  
  results.forEach(result => {
    const icon = result.isJSON && result.status === 200 ? '✓' : '✗';
    console.log(`${icon} ${result.path.substring(0, 60).padEnd(62)} ${result.status} ${!result.isJSON ? result.error : '(JSON)'}`);
  });
  
  const allGood = results.every(r => r.isJSON && r.status === 200);
  console.log(`\n${allGood ? '✓ All APIs working correctly!' : '⚠️ Some APIs still have issues'}`);
})();

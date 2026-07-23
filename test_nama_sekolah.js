const http = require('http');

const testUrls = [
  { port: 3004, path: '/admin/data-nama-sekolah', name: 'Port 3004' },
  { port: 3000, path: '/admin/data-nama-sekolah', name: 'Port 3000' }
];

async function testUrl(port, path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name,
          port,
          path,
          status: res.statusCode,
          hasError: data.includes('error') || data.includes('Error') || data.includes('500'),
          length: data.length
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name,
        port,
        path,
        status: 'ERROR',
        error: err.message.substring(0, 40),
        hasError: true
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        port,
        path,
        status: 'TIMEOUT',
        hasError: true
      });
    });

    req.end();
  });
}

(async () => {
  console.log('Testing nama-sekolah page...\n');
  
  const results = await Promise.all(
    testUrls.map(t => testUrl(t.port, t.path, t.name))
  );

  results.forEach(r => {
    const icon = r.hasError ? '✗' : '✓';
    console.log(`${icon} ${r.name.padEnd(15)} http://localhost:${r.port}${r.path}`);
    console.log(`  Status: ${r.status}${r.error ? ' - ' + r.error : ''}`);
  });
})();

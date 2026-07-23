const http = require('http');

console.log('Getting page content and looking for errors...\n');

const options = {
  hostname: 'localhost',
  port: 3004,
  path: '/admin/data-nama-sekolah',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract error-like content
    const errorPatterns = [
      /<div[^>]*error[^>]*>(.*?)<\/div>/gi,
      /error:\s*["\']([^"\']+)["\']/gi,
      /Error:\s*["\']([^"\']+)["\']/gi,
      /console\.error\(["\']([^"\']+)["\']/gi,
      /throw new Error\(["\']([^"\']+)["\']/gi,
    ];

    console.log('Analyzing page content...\n');
    
    let foundErrors = false;
    errorPatterns.forEach(pattern => {
      const matches = data.match(pattern);
      if (matches) {
        console.log('Found matches for pattern:', pattern.source);
        matches.slice(0, 3).forEach(match => {
          console.log('  -', match.substring(0, 100));
        });
        foundErrors = true;
      }
    });

    if (!foundErrors) {
      // Look for common error keywords
      const keywords = ['Error', 'error', 'failed', 'Failed', 'exception'];
      keywords.forEach(kw => {
        const idx = data.indexOf(kw);
        if (idx !== -1) {
          console.log(`Found "${kw}" at position ${idx}`);
          console.log('  Context:', data.substring(Math.max(0, idx - 50), idx + 100));
        }
      });
    }
  });
});

req.on('error', (err) => {
  console.log('✗ Request error:', err.message);
});

req.setTimeout(15000);
req.end();

const http = require('http');

console.log('Testing /admin/data-nama-sekolah on port 3004 with 15 second timeout...\n');

const options = {
  hostname: 'localhost',
  port: 3004,
  path: '/admin/data-nama-sekolah',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('✓ Got response:', res.statusCode);
  
  let chunks = [];
  res.on('data', chunk => {
    chunks.push(chunk);
  });
  
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString();
    console.log('Response length:', data.length, 'bytes');
    
    if (res.statusCode === 200) {
      console.log('✓ Page loaded successfully');
      // Check for error keywords
      if (data.includes('error') || data.includes('Error')) {
        console.log('⚠️  Page contains error messages');
      }
      if (data.includes('<!DOCTYPE')) {
        console.log('✓ Valid HTML response');
      }
    } else {
      console.log('✗ Server returned status:', res.statusCode);
      console.log('First 300 chars:', data.substring(0, 300));
    }
  });
});

req.on('error', (err) => {
  console.log('✗ Request error:', err.message);
});

req.on('timeout', () => {
  console.log('✗ Request timed out');
  req.destroy();
});

req.setTimeout(15000);
req.end();

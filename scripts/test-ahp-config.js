#!/usr/bin/env node

/**
 * Test script untuk verifikasi AHP Configuration API
 * Usage: node scripts/test-ahp-config.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Color codes untuk console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  log('cyan', '========================================');
  log('cyan', '  AHP Configuration API Test Suite');
  log('cyan', '========================================\n');

  try {
    // Test 1: POST - Save configuration
    log('blue', '📝 Test 1: POST /api/admin/ahp-config');
    log('blue', '-----------------------------------');
    
    const testConfig = {
      weights: {
        penduduk: 1.5,
        guru: 2.0,
        siswa: 1.2,
        rombel: 1.3,
        rasio: 1.0
      },
    };
    };

    log('yellow', `Sending: ${JSON.stringify(testConfig, null, 2)}\n`);

    const postResponse = await makeRequest('POST', '/api/admin/ahp-config', testConfig);

    if (postResponse.statusCode === 200 && postResponse.body.success) {
      log('green', '✓ POST successful');
      log('green', `Response: ${JSON.stringify(postResponse.body, null, 2)}\n`);
    } else {
      log('red', `✗ POST failed with status ${postResponse.statusCode}`);
      log('red', `Response: ${JSON.stringify(postResponse.body, null, 2)}\n`);
    }

    // Note: GET endpoint removed; this script only verifies POST and validation.

    // Test 3: Validation - Invalid input
    log('blue', '❌ Test 3: Validation - Invalid Input');
    log('blue', '-----------------------------------');

    const invalidConfig = {
      weights: {
        penduduk: -1, // Invalid: negative value
        guru: 2.0,
        siswa: 1.2,
        rombel: 1.3,
        rasio: 1.0
      },
    };
    };

    const invalidResponse = await makeRequest('POST', '/api/admin/ahp-config', invalidConfig);

    if (invalidResponse.statusCode !== 200) {
      log('green', '✓ Validation working - invalid input rejected');
      log('green', `Response: ${JSON.stringify(invalidResponse.body, null, 2)}\n`);
    } else {
      log('red', '✗ Validation failed - invalid input was accepted');
      log('red', `Response: ${JSON.stringify(invalidResponse.body, null, 2)}\n`);
    }

    // Skipping GET/default checks (endpoint removed)

    log('cyan', '========================================');
    log('green', '✓ All tests completed');
    log('cyan', '========================================\n');

  } catch (error) {
    log('red', `❌ Error running tests: ${error.message}`);
    log('yellow', '\nMake sure:');
    log('yellow', '1. Server is running (npm run dev)');
    log('yellow', '2. Database is connected');
    log('yellow', '3. Table pembobotan_ahp exists');
    process.exit(1);
  }
}

runTests();

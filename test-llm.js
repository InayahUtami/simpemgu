// Test LLM Gemini sederhana
// Cara pakai: node test-llm.js

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.log('\n❌ API KEY tidak ditemukan!');
  console.log('Pastikan file .env.local ada dan berisi GEMINI_API_KEY\n');
  process.exit(1);
}

async function testLLM() {
  // Ambil pertanyaan dari command line, atau pakai default
  const pertanyaan = process.argv.slice(2).join(' ') || 
    'Jelaskan apa itu LLM dalam 2 kalimat sederhana';

  console.log('\n🤖 TESTING GEMINI LLM\n');
  console.log('Pertanyaan:', pertanyaan);
  console.log('\nMemproses...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: pertanyaan }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error dari API:');
      console.log(error);
      process.exit(1);
    }

    const data = await response.json();
    const jawaban = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jawaban) {
      console.log('❌ Tidak ada jawaban dari LLM');
      process.exit(1);
    }

    console.log('✅ JAWABAN:\n');
    console.log('─'.repeat(60));
    console.log(jawaban);
    console.log('─'.repeat(60));
    
    console.log('\n📊 Info:');
    console.log('- Model: gemini-2.5-flash');
    console.log('- Jumlah kata:', jawaban.split(/\s+/).length);
    console.log('\n✅ Selesai!\n');

  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

testLLM();

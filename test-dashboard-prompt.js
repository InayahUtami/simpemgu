// Test prompt panjang seperti di route analyze-dashboard
// Cara pakai: node test-dashboard-prompt.js

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.log('\n❌ API KEY tidak ditemukan!\n');
  process.exit(1);
}

async function testDashboardPrompt() {
  console.log('\n🧪 TESTING DASHBOARD ANALYSIS PROMPT\n');
  console.log('Simulasi seperti di route /api/ai/analyze-dashboard\n');

  // Simulasi data dashboard (ganti dengan data real Anda)
  const allChartsData = `
Laju Pertumbuhan Penduduk (2018-2024):
2018: 0%, 2019: 1.43%, 2020: 0.36%, 2021: 0.89%, 2022: 1.12%, 2023: 0.95%, 2024: 1.05%

Jumlah Penduduk Total (2018-2024):
2018: 1,623,099 jiwa, 2019: 1,646,010 jiwa, 2020: 1,651,844 jiwa, 2021: 1,666,526 jiwa, 2022: 1,685,185 jiwa, 2023: 1,701,186 jiwa, 2024: 1,719,043 jiwa

Piramida Penduduk (2024):
0-4 tahun: L=52,000 P=48,000
5-9 tahun: L=54,000 P=51,000
15-19 tahun: L=68,000 P=65,000
25-29 tahun: L=85,000 P=82,000
35-39 tahun: L=78,000 P=75,000
45-49 tahun: L=65,000 P=63,000
55-59 tahun: L=48,000 P=47,000
65+ tahun: L=35,000 P=38,000

Kepadatan Penduduk per Kecamatan (2024):
Ilir Timur I: 8,500 jiwa/km²
Seberang Ulu I: 7,200 jiwa/km²
Ilir Barat I: 6,800 jiwa/km²
Sukarami: 2,100 jiwa/km²
Sako: 1,850 jiwa/km²
`;

  // PROMPT PERSIS SAMA DENGAN DI ROUTE
  const prompt = `Anda adalah seorang analis data demografi yang ahli. Berdasarkan data dashboard berikut, buatlah analisis komprehensif dalam bentuk narasi yang mudah dipahami.

DATA DASHBOARD:
${allChartsData}

INSTRUKSI:
Buatlah analisis dalam format narasi (bukan bullet points) dengan struktur berikut:

Paragraf 1: Gambaran umum kondisi demografis Palembang berdasarkan keempat indikator (laju pertumbuhan, jumlah penduduk, piramida usia, dan kepadatan).

Paragraf 2: Analisis mendalam tentang tren laju pertumbuhan penduduk - apakah meningkat, menurun, atau fluktuatif? Apa implikasinya?

Paragraf 3: Pembahasan distribusi penduduk berdasarkan data jumlah dan kepadatan per kecamatan - kecamatan mana yang paling padat, mana yang jarang penduduk, dan mengapa ini penting?

Paragraf 4: Analisis struktur umur penduduk dari piramida - apakah populasi didominasi usia muda, produktif, atau lansia? Apa artinya untuk pembangunan kota?

Paragraf 5: Kesimpulan terintegrasi dan rekomendasi kebijakan berdasarkan temuan dari keempat aspek tersebut.

Gunakan bahasa yang profesional namun mudah dipahami. Sebutkan angka-angka spesifik dari data untuk mendukung analisis Anda. Buatlah analisis yang koheren dan mengalir antar paragraf.`;

  console.log('⏳ Mengirim ke Gemini API...\n');
  console.log('📊 Data yang dikirim:');
  console.log('- Laju Pertumbuhan: 7 tahun');
  console.log('- Jumlah Penduduk: 7 tahun');
  console.log('- Piramida Usia: 8 kelompok');
  console.log('- Kepadatan: 5 kecamatan');
  console.log('\n⏳ Processing (bisa 10-20 detik)...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3072,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error:', error);
      process.exit(1);
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      console.log('❌ Tidak ada analisis dihasilkan');
      process.exit(1);
    }

    console.log('✅ ANALISIS BERHASIL DIBUAT!');

    // Statistik
    const paragraphs = analysis.split('\n\n').filter(p => p.trim().length > 50);
    const wordCount = analysis.split(/\s+/).length;
    const hasNumbers = /\d+[\.,]?\d*/.test(analysis);
    const hasBullets = /^[\-\*•]|^\d+\./m.test(analysis);

    console.log('\n📊 STATISTIK OUTPUT:');
    console.log('─'.repeat(70));
    console.log(`Jumlah Paragraf: ${paragraphs.length} ${paragraphs.length === 5 ? '✅' : '⚠️ (target: 5)'}`);
    console.log(`Jumlah Kata: ${wordCount}`);
    console.log(`Menggunakan Angka: ${hasNumbers ? '✅ Ya' : '❌ Tidak'}`);
    console.log(`Format Bullet Points: ${hasBullets ? '❌ Ada (harusnya tidak)' : '✅ Tidak ada'}`);
    console.log('─'.repeat(70));

    console.log('\n💾 Menyimpan ke file...');
    const fs = require('fs');
    const filename = `dashboard-analysis-${Date.now()}.txt`;
    const output = `ANALISIS DASHBOARD SISTEM PEMERATAAN GURU KOTA PALEMBANG
${'='.repeat(70)}
Generated: ${new Date().toLocaleString('id-ID')}
Model: gemini-2.5-flash
Temperature: 0.7

PROMPT:
${prompt}

${'='.repeat(70)}

HASIL ANALISIS:
${analysis}

${'='.repeat(70)}

STATISTIK:
- Paragraf: ${paragraphs.length}
- Kata: ${wordCount}
- Menggunakan angka: ${hasNumbers ? 'Ya' : 'Tidak'}
- Format narasi: ${!hasBullets ? 'Ya' : 'Tidak'}
`;

    fs.writeFileSync(filename, output, 'utf8');
    console.log(`✅ Disimpan ke: ${filename}`);
    console.log(`\nBuka file: notepad ${filename}\n`);

  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboardPrompt();

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { allChartsData } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Auto-detect available models
    let modelToUse = 'gemini-1.5-flash';
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModels = modelsData.models?.filter((m: { name: string; supportedGenerationMethods?: string[] }) => 
          m.supportedGenerationMethods?.includes('generateContent')
        ) || [];
        
        if (availableModels.length > 0) {
          modelToUse = availableModels[0].name.replace('models/', '');
        }
      }
    } catch (error) {
      console.error('Error detecting models:', error);
    }

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
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
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate analysis', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated';

    return NextResponse.json({ analysis, model: modelToUse });
  } catch (error) {
    console.error('Error in analyze-dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData, chartType, title, context } = body;

    if (!chartData || !chartType) {
      return NextResponse.json(
        { error: 'chartData dan chartType harus disediakan' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY tidak ditemukan di environment variables' },
        { status: 500 }
      );
    }

    // Auto-detect available models
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!modelsResponse.ok) {
      const errorData = await modelsResponse.text();
      return NextResponse.json(
        { error: 'Gagal mendapatkan daftar model', details: errorData },
        { status: modelsResponse.status }
      );
    }

    const modelsData = await modelsResponse.json();
    const availableModels = modelsData.models?.filter((model: { name: string; supportedGenerationMethods?: string[] }) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    if (availableModels.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada model yang tersedia untuk generateContent' },
        { status: 500 }
      );
    }

    const modelToUse = availableModels[0].name;
    console.log('Using model:', modelToUse);

    // Simplify data
    const simplifiedData = Array.isArray(chartData) 
      ? chartData.slice(0, 50)
      : chartData;

    // Prompt untuk analisis naratif
    const prompt = `Analisis grafik "${title}" dengan membaca data berikut:

${JSON.stringify(simplifiedData, null, 2)}

Tulis analisis deskriptif dalam bentuk paragraf (BUKAN bullet points) yang menjelaskan data secara lengkap.

WAJIB menulis 4-5 paragraf yang membahas:
1. Paragraf pertama: Kondisi awal/titik mulai data
2. Paragraf kedua: Perubahan/tren utama yang terjadi
3. Paragraf ketiga: Titik tertinggi/terendah atau anomali
4. Paragraf keempat: Pola atau variabilitas keseluruhan
5. Paragraf kelima (opsional): Kesimpulan atau interpretasi

Gunakan angka KONKRET dari data (jangan umum).
Tulis dengan gaya seperti ini:
"Laju pertumbuhan penduduk pada tahun 2018 tercatat 0%, yang dapat diinterpretasikan sebagai tahun dasar perhitungan. Terjadi penurunan drastis dari 1.43% pada tahun 2019 menjadi 0.36% pada tahun 2020, sebuah anomali yang sangat mungkin terkait dengan dampak pandemi COVID-19."

PENTING: Pastikan menulis LENGKAP sampai selesai, jangan potong di tengah kalimat.

Mulai:`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`;
    console.log('Calling Gemini API...');
    
    const response = await fetch(
      geminiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            candidateCount: 1,
          },
        }),
      }
    );

    console.log('Gemini API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error Response:', errorData);
      console.error('API Key used (first 10 chars):', apiKey.substring(0, 10));
      return NextResponse.json(
        { error: 'Gagal mendapatkan respons dari Gemini API', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json(
        { error: 'Format respons Gemini tidak sesuai' },
        { status: 500 }
      );
    }

    const analysis = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        chartType,
        title,
        dataPoints: Array.isArray(chartData) ? chartData.length : Object.keys(chartData).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error in AI analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal', details: errorMessage },
      { status: 500 }
    );
  }
}


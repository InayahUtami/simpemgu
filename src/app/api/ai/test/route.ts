import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not found in environment variables',
      });
    }

    // Test simple request to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
                  text: 'Halo, coba katakan "API berfungsi dengan baik" dalam bahasa Indonesia.',
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: 'Gemini API returned error',
        details: data,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working!',
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text',
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Exception occurred',
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}


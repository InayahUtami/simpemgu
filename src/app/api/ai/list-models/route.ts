import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not found',
      });
    }

    // List available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: 'Failed to list models',
        details: data,
      });
    }

    // Filter models that support generateContent
    const generateContentModels = data.models?.filter((model: { name: string; supportedGenerationMethods?: string[] }) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    return NextResponse.json({
      success: true,
      totalModels: data.models?.length || 0,
      generateContentModels: generateContentModels.map((m: { name: string; displayName?: string; description?: string; supportedGenerationMethods?: string[] }) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        methods: m.supportedGenerationMethods,
      })),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Exception occurred',
      message: errorMessage,
    });
  }
}


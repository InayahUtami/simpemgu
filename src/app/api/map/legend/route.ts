import { NextResponse } from 'next/server';
import { getMapLegend, createMapLegend } from '@/lib/mapLegend';

export async function GET() {
  try {
    const defaultLegend = {
      text: 'Peta Kota Palembang per Kecamatan. Warna menandakan area administrasi.',
      color: '#1e3a8a'
    };

    const legend = await getMapLegend();
    return new NextResponse(JSON.stringify({ 
      success: true, 
      data: legend || defaultLegend
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching map legend:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch map legend' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, color } = body;

    const legend = await createMapLegend({ text, color });
    return new NextResponse(JSON.stringify({ 
      success: true, 
      data: legend
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating map legend:', error);
    return NextResponse.json({ success: false, error: 'Failed to update map legend' }, { status: 500 });
  }
}

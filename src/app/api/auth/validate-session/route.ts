import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ valid: false });
    }

    // Query database untuk cek session
    const sessions = await query(
      'SELECT * FROM admin_sessions WHERE session_id = ? AND expires_at > NOW() LIMIT 1',
      [sessionId]
    );

    const valid = sessions && sessions.length > 0;
    console.log('API: Validasi session:', { sessionId, valid });

    return NextResponse.json({ valid });
  } catch (error) {
    console.error('API: Validasi session error:', error);
    return NextResponse.json({ valid: false });
  }
}


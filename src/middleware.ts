import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  let response: NextResponse;

  // TEMPORARY: Disable middleware protection untuk testing ngrok
  // Nanti akan diaktifkan kembali setelah cookie fix
  console.log('MIDDLEWARE: Path:', pathname, '- Allowing all access (ngrok mode)');
  response = NextResponse.next();

  /* ORIGINAL CODE - DISABLED FOR NGROK TESTING */
  /*
  // Proteksi halaman admin
  if (pathname.startsWith('/admin')) {
    // Cek apakah ada cookie admin_session_id
    const sessionId = request.cookies.get('admin_session_id')?.value;

    // Jika tidak ada session ID, redirect ke login
    // TAPI: untuk ngrok, kita skip validasi session karena cookie issue
    // Validasi akan dilakukan di client-side dengan localStorage
    if (!sessionId) {
      console.log('MIDDLEWARE: No session cookie, tapi allowing access (ngrok mode)');
      // Untuk ngrok, kita allow dulu - validasi di client side
      response = NextResponse.next();
    } else {
      // Validasi session via API (karena middleware Edge Runtime tidak bisa query DB langsung)
      try {
        const baseUrl = request.nextUrl.clone();
        baseUrl.pathname = '/api/auth/validate-session';
        baseUrl.search = '';

        const validateRes = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const result = await validateRes.json();

        if (!result.valid) {
          console.log('MIDDLEWARE: Session invalid/expired, redirect ke login untuk path:', pathname);
          response = NextResponse.redirect(new URL('/login', request.url));
        } else {
          console.log('MIDDLEWARE: Session valid, allowing access untuk path:', pathname);
          response = NextResponse.next();
        }
      } catch (error) {
        console.error('MIDDLEWARE: Validasi session error:', error);
        // Jika error, redirect ke login untuk safety
        response = NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } else {
    response = NextResponse.next();
  }
  */

  // Add aggressive no-cache headers for all responses (especially mobile)
  // Add aggressive no-cache headers for all responses (especially mobile)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  
  // Add ngrok skip browser warning header for ngrok deployment
  response.headers.set('ngrok-skip-browser-warning', 'true');
  
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard', '/data/:path*', '/']
};



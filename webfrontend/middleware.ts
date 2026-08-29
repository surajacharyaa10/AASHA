import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  // Root redirects to dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Define protected routes (everything except login and public assets)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  
  // Exclude api, _next/static, _next/image, favicon.ico
  const isApiOrStatic = request.nextUrl.pathname.startsWith('/api') || 
                        request.nextUrl.pathname.startsWith('/_next') ||
                        request.nextUrl.pathname === '/favicon.ico';

  if (isApiOrStatic) {
    return NextResponse.next();
  }

  if (!authToken && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

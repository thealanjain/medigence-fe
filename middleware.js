import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/'];

const PATIENT_PATHS = ['/onboarding', '/doctors', '/chat'];
const DOCTOR_PATHS = ['/dashboard', '/chat'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('medigence_token')?.value;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DEBUGGING MODE: Minimal Middleware to verify infrastructure works.
export function middleware(request: NextRequest) {
    console.log("Middleware: Alive and running for", request.nextUrl.pathname);
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

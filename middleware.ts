import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // Refresh session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 1. PROTECT ADMIN ROUTES
    if (request.nextUrl.pathname.startsWith('/sys-admin')) {
        if (!user) {
            console.log("Middleware: No user found for /sys-admin request");
            return NextResponse.redirect(new URL('/', request.url));
        }

        console.log("Middleware: Checking admin role for user", user?.id);

        // Check for "admin" role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            console.log("Middleware: Access denied. Role is", profile?.role);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

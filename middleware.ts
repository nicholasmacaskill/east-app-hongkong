import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    try {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Middleware: Missing Supabase Env Vars. Skipping auth checks.');
            return response;
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                            response = NextResponse.next({
                                request,
                            })
                            cookiesToSet.forEach(({ name, value, options }) =>
                                response.cookies.set(name, value, options)
                            )
                        } catch (err) {
                            console.error("Middleware: Failed to set cookies", err);
                        }
                    },
                },
            }
        );

        // Refresh session
        let {
            data: { user },
        } = await supabase.auth.getUser();

        // Fallback: Check for Bearer Token (for API routes)
        if (!user && request.headers.get('Authorization')) {
            const token = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (token) {
                const { data: { user: headerUser } } = await supabase.auth.getUser(token);
                user = headerUser;
            }
        }

        // 1. GLOBAL PROTECTION (Unauthenticated)
        const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
        const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/forgot-password');
        const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
        const isPublicPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/public') || isAuthPage || isWebhook;

        if (!user && !isPublicPage) {
            if (isApiRequest) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 2. ROLE-BASED PROTECTION
        if (user) {
            // BYPASS RLS: Use Service Role Key to check role securely
            const serviceRoleSupabase = createServerClient(
                supabaseUrl,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    cookies: {
                        getAll() { return request.cookies.getAll() },
                        setAll() { }
                    }
                }
            );

            // DEFENSIVE: Retry profile fetch to handle race conditions for new users
            let profile = null;
            let role = null;

            for (let i = 0; i < 3; i++) {
                const { data } = await serviceRoleSupabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (data?.role) {
                    profile = data;
                    role = data.role;
                    break;
                }

                // Wait 150ms before retry
                if (i < 2) await new Promise(resolve => setTimeout(resolve, 150));
            }

            // Admin only
            if (request.nextUrl.pathname.startsWith('/sys-admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
                if (role !== 'admin' && role !== 'sys-admin') {
                    if (isApiRequest) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                    return NextResponse.redirect(new URL('/', request.url));
                }
            }

            // Coach only
            if (request.nextUrl.pathname.startsWith('/coach') || request.nextUrl.pathname.startsWith('/api/coach')) {
                if (role !== 'admin' && role !== 'sys-admin' && role !== 'coach') {
                    if (isApiRequest) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                    return NextResponse.redirect(new URL('/', request.url));
                }
            }
        }

        return response;

    } catch (e) {
        // FAIL OPEN: If middleware crashes, log it but don't take down the site
        console.error("CRITICAL MIDDLEWARE ERROR:", e);
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

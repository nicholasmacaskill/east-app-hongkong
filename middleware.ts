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

            // BYPASS RLS: Use Service Role Key to check admin status securely
            const serviceRoleSupabase = createServerClient(
                supabaseUrl,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    cookies: {
                        getAll() { return request.cookies.getAll() },
                        setAll() { } // No setting cookies with service role client
                    }
                }
            );

            // Check for "admin" role
            const { data: profile } = await serviceRoleSupabase
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

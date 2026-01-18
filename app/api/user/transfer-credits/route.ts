import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, amount } = body;

        if (!recipientId || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
        }

        // Initialize Supabase Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the current user from the session cookie / auth header
        // In a Next.js App Router API route, we need to handle auth carefully.
        // Assuming the request comes from the client with the user's session.

        // We need to use createRouteHandlerClient from @supabase/auth-helpers-nextjs 
        // OR manually handle the token if we want to be strict.
        // But for simplicity with standard Supabase + Next.js setup:

        // Note: To properly get the authenticated user in the API route, 
        // we usually need the cookies from the request.
        // However, since we are calling an RPC that is SECURITY DEFINER,
        // we can pass the user ID if we trust the client OR we can fetch it from the token.

        // Better approach: Use the server-side auth to get the user ID
        // We will assume the standard headers are passed.

        // Let's rely on the client passing the access token in headers or similar? 
        // Actually, the standard way in this project seems to be using `getSupabaseAdmin` 
        // implies we might not have user context easily unless we use the standard supabase-js with cookies.

        // Let's verify how other routes do it. 
        // `app/api/sessions/book/route.ts` usually does this.

        // Let's peek at `app/api/sessions/book/route.ts` to see how they get the user.

        // For now, I will write a standard implementation that checks for the user ID from the Authorization header 
        // or uses the service role to call the RPC, but we need the SENDER's ID.

        // Wait, if I use `createClient` with the anon key and pass the access token, 
        // I can get `await supabase.auth.getUser()`.

        // Let's write a robust version.

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Now call the RPC as the authenticated user? 
        // Or call it as Admin but pass the user ID?
        // Since `transfer_credits` checks `p_from_user_id`, we can call it as admin but we MUST pass `user.id` as `p_from_user_id`.
        // This ensures the user can only transfer FROM themselves.

        const { data, error } = await supabase.rpc('transfer_credits', {
            p_from_user_id: user.id,
            p_to_user_id: recipientId,
            p_amount: amount
        });

        if (error) {
            console.error('Transfer error:', error);
            // The RPC returns { success: false, message: ... } on logic errors, 
            // but if it throws (e.g. permission), it comes here.
            // Wait, the RPC acts as a function, so `data` will contain the JSON result if it didn't crash.
            // If it crashed, `error` is populated.
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        // RPC returns a JSON object like { success: true, ... }
        if (data && !data.success) {
            return NextResponse.json({ success: false, error: data.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

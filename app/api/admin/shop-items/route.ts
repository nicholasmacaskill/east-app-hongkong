import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ── Helper: verify caller is admin/sys-admin ──────────────────────────────────
async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return null;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['sys-admin', 'admin'].includes(profile.role)) return null;
    return { user, role: profile.role };
}

// ── GET — return all active shop items (admin only) ───────────────────────────
export async function GET(request: Request) {
    const caller = await verifyAdmin(request);
    if (!caller) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('shop_items')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// ── POST — create a new shop item (admin only) ────────────────────────────────
export async function POST(request: Request) {
    const caller = await verifyAdmin(request);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, price_credits, category } = await request.json();
    if (!name || !price_credits || price_credits <= 0) {
        return NextResponse.json({ error: 'name and positive price_credits required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('shop_items')
        .insert({ name: name.trim(), price_credits: Number(price_credits), category: category || 'general' })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// ── PUT — update an existing item (admin only) ────────────────────────────────
export async function PUT(request: Request) {
    const caller = await verifyAdmin(request);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, price_credits, category, active } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (price_credits !== undefined) updates.price_credits = Number(price_credits);
    if (category !== undefined) updates.category = category;
    if (active !== undefined) updates.active = active;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('shop_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// ── DELETE — soft-delete (deactivate) an item (admin only) ───────────────────
export async function DELETE(request: Request) {
    const caller = await verifyAdmin(request);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('shop_items')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeMode } from '@/app/lib/stripe-config';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const mode = getStripeMode();
        if (mode !== 'test') {
            return NextResponse.json({ error: 'Only available in test mode' }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const secretKey = getStripeSecretKey();
        console.log(`🧪 TEST CONFIRM: Checking sessions for User ${userId}`);
        const stripe = new Stripe(secretKey);

        const sessions = await stripe.checkout.sessions.list({
            limit: 50,
            expand: ['data.line_items']
        });

        console.log(`🧪 TEST CONFIRM: Found ${sessions.data.length} recent sessions.`);

        const userSession = sessions.data.find(s => 
            (s.metadata?.userId === userId || s.metadata?.target_user_id === userId) && 
            s.payment_status === 'paid'
        );

        if (!userSession) {
            console.log(`❌ TEST CONFIRM: No session found for ${userId}.`);
            console.log(`Debug - Target to match: ${userId}`);
            sessions.data.forEach((s, idx) => {
                console.log(`Session ${idx} (${s.id}): Status: ${s.payment_status}, Metadata UID: ${s.metadata?.userId}, Target UID: ${s.metadata?.target_user_id}`);
            });
            return NextResponse.json({ error: 'No recent paid session found for this user' }, { status: 404 });
        }

        console.log(`✅ TEST CONFIRM: Found session ${userSession.id}. Processing...`);

        // 2. Map Price ID to Tier (Mirroring Webhook logic)
        const priceId = userSession.line_items?.data[0]?.price?.id;
        
        let tier = 'individual';
        let credits = 1000;

        if (priceId) {
          // Quick map for common test prices
          if (priceId.includes('FAMILY_3')) { tier = 'family_3plus'; credits = 3500; }
          else if (priceId.includes('FAMILY_2')) { tier = 'family_2'; credits = 2500; }
          else if (priceId.includes('YEARLY')) { tier = 'individual'; credits = 15000; }
        }

        const isSubscription = userSession.mode === 'subscription';
        const creditAmountMetadata = parseInt(userSession.metadata?.credit_amount || '0');
        const finalCredits = creditAmountMetadata || credits;
        
        const supabaseAdmin = getSupabaseAdmin();

        // 3. Prevent Double Processing (Idempotency)
        const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('stripe_session_id', userSession.id)
            .single();

        if (existingTx) {
            console.log(`⚠️ TEST CONFIRM: Session ${userSession.id} already processed.`);
            return NextResponse.json({ message: 'Credits already added', alreadyProcessed: true });
        }

        // 4. Update Database
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();
        
        const currentCredits = profile?.credits || 0;

        if (isSubscription) {
            const subscriptionId = userSession.subscription as string;
            const customerId = userSession.customer as string;
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabaseAdmin.from('profiles').update({
                credits: currentCredits + finalCredits,
                subscription_status: 'active',
                account_status: 'active',
                tier: tier,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                membership_start: new Date().toISOString(),
                membership_expires: expiresAt
            }).eq('id', userId);

            await supabaseAdmin.from('transactions').insert({
                user_id: userId,
                amount: finalCredits,
                type: 'membership',
                stripe_session_id: userSession.id,
                description: `TEST MODE: Manual ${tier} activation (+${finalCredits} credits)`
            });

        } else {
            await supabaseAdmin.from('profiles').update({
                credits: currentCredits + finalCredits,
                account_status: 'active'
            }).eq('id', userId);

            await supabaseAdmin.from('transactions').insert({
                user_id: userId,
                amount: finalCredits,
                type: 'topup',
                stripe_session_id: userSession.id,
                description: `TEST MODE: Manual credit top-up (+${finalCredits} credits)`
            });
        }

        console.log(`✅ TEST CONFIRM SUCCESS: Added ${finalCredits} credits to user ${userId}`);

        return NextResponse.json({ 
            success: true, 
            message: 'Test credits added successfully!',
            credits: finalCredits
        });

    } catch (error: any) {
        console.error('Test Confirm Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

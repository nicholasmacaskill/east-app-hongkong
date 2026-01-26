-- Check recent parent purchases and their children
SELECT 
    p.id as parent_id,
    p.name as parent_name,
    p.email as parent_email,
    p.tier as parent_tier,
    p.subscription_status as parent_status,
    p.stripe_customer_id,
    (
        SELECT json_agg(json_build_object(
            'child_id', c.id,
            'child_name', c.name,
            'child_email', c.email,
            'subscription_status', c.subscription_status,
            'account_status', c.account_status,
            'membership_expires', c.membership_expires
        ))
        FROM profiles c
        WHERE c.parent_id = p.id
    ) as children
FROM profiles p
WHERE p.role = 'parent'
    AND p.stripe_customer_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;

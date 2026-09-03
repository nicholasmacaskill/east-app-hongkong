import { test, expect } from '@playwright/test';
import { TestFactory } from './helpers/test-factory';

test.describe('Zero-Trust Role Security & Authorization Barrier', () => {
    let parentA: any;
    let parentB: any;
    let childA: any;

    test.beforeAll(async () => {
        // Create two independent parents
        parentA = await TestFactory.createUser({ role: 'parent', firstName: 'ParentAlpha' });
        parentB = await TestFactory.createUser({ role: 'parent', firstName: 'ParentBeta' });

        // Create child athlete
        childA = await TestFactory.createUser({ role: 'player', firstName: 'ChildAlpha' });

        // Assign child to parentA
        await TestFactory.supabase
            .from('profiles')
            .update({ parent_id: parentA.id, contact_email: parentA.email })
            .eq('id', childA.id);

        await TestFactory.supabase
            .from('player_relationships')
            .upsert({ parent_id: parentA.id, child_id: childA.id });
    });

    test.afterAll(async () => {
        await TestFactory.cleanup();
    });

    test('should reject conversion attempt if parentId does not match child ownership (403)', async ({ request }) => {
        // Parent B attempts to convert Parent A's child
        const res = await request.post('/api/family/convert-child', {
            data: {
                childId: childA.id,
                parentId: parentB.id, // Wrong parent!
                email: `hacked-${Date.now()}@pw.test`,
                password: 'password12345'
            }
        });

        expect(res.status()).toBe(403);
        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });

    test('should reject conversion with invalid or short password (400)', async ({ request }) => {
        const res = await request.post('/api/family/convert-child', {
            data: {
                childId: childA.id,
                parentId: parentA.id,
                email: `valid-${Date.now()}@pw.test`,
                password: '123' // Too short (< 6 chars)
            }
        });

        expect(res.status()).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Password must be at least 6 characters');
    });

    test('should reject registration if missing parentId (400)', async ({ request }) => {
        const res = await request.post('/api/family/add-child', {
            data: {
                firstName: 'OrphanChild'
                // parentId missing
            }
        });

        expect(res.status()).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Missing required fields');
    });
});

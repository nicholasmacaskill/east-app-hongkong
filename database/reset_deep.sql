-- Deep Reset Script
-- Clears all data while preserving admin@east.com

BEGIN;

-- 1. Clear Public Data Tables (Order matters for FKs if not cascading, but we try to hit leaves first)
DELETE FROM public.registrations;
DELETE FROM public.players_stats;
DELETE FROM public.player_relationships;
DELETE FROM public.availability;
DELETE FROM public.voice_commands;
DELETE FROM public.likes;
DELETE FROM public.messages;
DELETE FROM public.posts;
DELETE FROM public.coach_services;
DELETE FROM public.sessions;
DELETE FROM public.session_types;
DELETE FROM public.announcements;
DELETE FROM public.admin_audit_logs;
DELETE FROM public.coach_notes;
DELETE FROM public.golf_stats;
DELETE FROM public.leaderboard_entries;
DELETE FROM public.test_emails;
DELETE FROM public.transactions;
DELETE FROM public.webhook_debug_logs;

-- 2. Clear Storage Objects (if any blocks user deletion)
DELETE FROM storage.objects;

-- 3. Clear Profiles (Except Admin)
DELETE FROM public.profiles 
WHERE contact_email NOT ILIKE 'admin@east.com';

-- 4. Clear Auth Users (Except Admin)
-- We need to clear referencing auth tables first usually
DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE 'admin@east.com');

DELETE FROM auth.sessions 
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE 'admin@east.com');

DELETE FROM auth.mfa_factors 
WHERE user_id IN (SELECT id FROM auth.users WHERE email NOT ILIKE 'admin@east.com');

DELETE FROM auth.users 
WHERE email NOT ILIKE 'admin@east.com';

COMMIT;

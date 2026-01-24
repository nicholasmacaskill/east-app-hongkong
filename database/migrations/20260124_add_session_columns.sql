-- Migration: Add session_type_id and max_capacity to sessions
-- Required for Coach Availability Dual-Write and Admin Schedule Generator

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sessions'
        AND column_name = 'session_type_id'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN session_type_id UUID REFERENCES public.session_types(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sessions'
        AND column_name = 'max_capacity'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN max_capacity INTEGER DEFAULT 1;
    END IF;
END $$;

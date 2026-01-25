


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."book_coach_atomic"("p_user_id" "uuid", "p_coach_id" "uuid", "p_session_id" bigint, "p_credit_cost" integer, "p_attendee_id" "uuid" DEFAULT NULL::"uuid", "p_origin" "text" DEFAULT 'facilities'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_credits int;
  v_new_balance int;
  v_final_attendee_id uuid;
BEGIN
  v_final_attendee_id := COALESCE(p_attendee_id, p_user_id);

  PERFORM * FROM availability 
  WHERE coach_id = p_coach_id 
  AND start_time <= (SELECT start_time FROM sessions WHERE id = p_session_id)
  AND end_time >= (SELECT end_time FROM sessions WHERE id = p_session_id)
  FOR UPDATE;
  
  SELECT credits INTO v_user_credits FROM profiles WHERE id = p_user_id;
  IF v_user_credits < p_credit_cost THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient credits.', 'current_balance', v_user_credits);
  END IF;
  
  UPDATE profiles SET credits = credits - p_credit_cost WHERE id = p_user_id RETURNING credits INTO v_new_balance;
  
  INSERT INTO registrations (user_id, session_id, payer_id, credits_paid)
  VALUES (v_final_attendee_id, p_session_id, p_user_id, p_credit_cost);
  
  RETURN json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_new_balance);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Booking failed: ' || SQLERRM);
END;
$$;


ALTER FUNCTION "public"."book_coach_atomic"("p_user_id" "uuid", "p_coach_id" "uuid", "p_session_id" bigint, "p_credit_cost" integer, "p_attendee_id" "uuid", "p_origin" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_credit_cost int;
    v_user_credits int;
    v_sub_status text;
    v_final_attendee_id uuid;
    v_new_balance int;
BEGIN
    -- Determine who is actually attending
    v_final_attendee_id := COALESCE(p_attendee_id, p_user_id);

    -- Get session cost
    SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;
    
    -- Get payer credits and subscription status
    SELECT credits, subscription_status INTO v_user_credits, v_sub_status 
    FROM profiles WHERE id = p_user_id;

    IF v_credit_cost IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Session cost not defined.');
    END IF;

    -- Subscription check: Must be active or trialing
    IF v_sub_status IS NULL OR (v_sub_status != 'active' AND v_sub_status != 'trialing') THEN
        RETURN json_build_object('success', false, 'message', 'Membership dormant. Renew to unlock credits.');
    END IF;

    -- Credit check
    IF v_user_credits < v_credit_cost THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient credits.');
    END IF;

    -- Deduct credits from PAYER
    UPDATE profiles SET credits = credits - v_credit_cost WHERE id = p_user_id
    RETURNING credits INTO v_new_balance;
    
    -- ✅ CRITICAL: Store credits_paid for accurate refunds
    INSERT INTO registrations (user_id, session_id, payer_id, credits_paid) 
    VALUES (v_final_attendee_id, p_session_id, p_user_id, v_credit_cost);

    RETURN json_build_object(
        'success', true, 
        'message', 'Booking confirmed!', 
        'new_balance', v_new_balance
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Booking failed: ' || SQLERRM);
END;
$$;


ALTER FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid") IS 'Atomic facility booking with credit deduction and refund tracking';



CREATE OR REPLACE FUNCTION "public"."cancel_session_and_refund"("p_attendee_id" "uuid", "p_session_id" bigint) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_credit_cost int;
  v_payer_id uuid;
begin
  -- Check registration and get Payer
  SELECT payer_id INTO v_payer_id 
  FROM registrations 
  WHERE user_id = p_attendee_id AND session_id = p_session_id;

  if not found then
    return json_build_object('success', false, 'message', 'Booking not found.');
  end if;

  -- Default payer to attendee if null
  v_payer_id := COALESCE(v_payer_id, p_attendee_id);

  select credit_cost into v_credit_cost from sessions where id = p_session_id;

  if v_credit_cost is null then
    delete from registrations where user_id = p_attendee_id and session_id = p_session_id;
    return json_build_object('success', true, 'message', 'Cancellation confirmed.');
  end if;

  -- Refund PAYER
  update profiles set credits = credits + v_credit_cost where id = v_payer_id;
  delete from registrations where user_id = p_attendee_id and session_id = p_session_id;

  return json_build_object('success', true, 'message', 'Cancellation successful. Credits refunded.', 'refund_amount', v_credit_cost);
end;
$$;


ALTER FUNCTION "public"."cancel_session_and_refund"("p_attendee_id" "uuid", "p_session_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text" DEFAULT 'QR Payment'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
    UPDATE public.profiles SET credits = credits - p_amount WHERE id = p_user_id RETURNING credits INTO v_new_credits;
    INSERT INTO public.transactions (user_id, amount, type, description) VALUES (p_user_id, -p_amount, 'booking', p_reason);
    RETURN json_build_object('success', true, 'new_balance', v_new_credits);
END;
$$;


ALTER FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;


ALTER FUNCTION "public"."get_auth_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  meta_first text;
  meta_last text;
  meta_full text;
BEGIN
  meta_first := new.raw_user_meta_data->>'first_name';
  meta_last := new.raw_user_meta_data->>'last_name';
  meta_full := new.raw_user_meta_data->>'full_name';
  
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role, membership_tier, username, contact_email)
  VALUES (
    new.id,
    COALESCE(meta_first, split_part(meta_full, ' ', 1), 'User'),
    COALESCE(meta_last, substring(meta_full from length(split_part(meta_full, ' ', 1)) + 2), ''),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'player'),
    'individual',
    new.email,
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."master_book_atomic"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_ids" "uuid"[], "p_coach_id" "uuid" DEFAULT NULL::"uuid", "p_coach_tier" "text" DEFAULT 'junior'::"text", "p_origin" "text" DEFAULT 'facilities'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_main_session_start TIMESTAMPTZ;
  v_main_session_end TIMESTAMPTZ;
  v_main_session_title TEXT;
  v_main_session_cost INT;
  v_max_capacity INT;
  v_current_bookings INT;
  
  v_coach_first_name TEXT;
  v_coach_last_name TEXT;
  v_coach_avatar TEXT;
  v_coach_cost INT;
  v_coach_session_id BIGINT;
  
  v_total_cost INT;
  v_user_credits INT;
  v_user_sub_status TEXT;
  v_user_acc_status TEXT;
  v_parent_id UUID;
  
  v_attendee_id UUID;
  v_coach_available BOOLEAN;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- 1. LOCK USER PROFILE 
  SELECT credits, subscription_status, account_status, parent_id 
  INTO v_user_credits, v_user_sub_status, v_user_acc_status, v_parent_id
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'User profile not found'); END IF;

  -- 2. HANDLE CHILD ACCOUNTS
  IF v_parent_id IS NOT NULL THEN
    SELECT subscription_status, account_status INTO v_user_sub_status, v_user_acc_status
    FROM public.profiles WHERE id = v_parent_id;
  END IF;

  -- 3. CHECK STATUS
  IF v_user_sub_status NOT IN ('active', 'trialing') AND v_user_acc_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Account Locked', 'code', 'SUBSCRIPTION_LOCKED');
  END IF;

  -- 4. FETCH MAIN SESSION
  SELECT start_time, end_time, title, credit_cost, max_capacity 
  INTO v_main_session_start, v_main_session_end, v_main_session_title, v_main_session_cost, v_max_capacity
  FROM public.sessions WHERE id = p_session_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Main session not found'); END IF;

  -- 5. CALCULATE COST
  v_coach_cost := CASE 
    WHEN p_coach_tier = 'senior' THEN 850 WHEN p_coach_tier = 'junior' THEN 500 
    WHEN p_coach_tier = 'golf' THEN 1100 WHEN p_coach_tier = 'pt' THEN 700 
    WHEN p_coach_tier = 'hyrox' THEN 800 ELSE 750 END;

  v_total_cost := 0;
  IF p_origin = 'facilities' THEN v_total_cost := v_total_cost + (v_main_session_cost * array_length(p_attendee_ids, 1)); END IF;
  IF p_coach_id IS NOT NULL THEN v_total_cost := v_total_cost + (v_coach_cost * array_length(p_attendee_ids, 1)); END IF;

  -- 6. CHECK CREDITS
  IF v_user_credits < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient credits.', 'code', 'INSUFFICIENT_CREDITS');
  END IF;

  -- 7. CHECK CAPACITY
  SELECT count(*) INTO v_current_bookings FROM public.registrations WHERE session_id = p_session_id;
  IF v_current_bookings + array_length(p_attendee_ids, 1) > v_max_capacity THEN
    RETURN jsonb_build_object('success', false, 'message', 'Capacity met', 'code', 'CAPACITY_MET');
  END IF;

  -- 8. COACH LOGIC (If applicable)
  IF p_coach_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.availability WHERE coach_id = p_coach_id AND start_time <= v_main_session_start AND end_time >= v_main_session_end) INTO v_coach_available;
    IF NOT v_coach_available THEN RETURN jsonb_build_object('success', false, 'message', 'Coach not available'); END IF;

    SELECT first_name, last_name, avatar_url INTO v_coach_first_name, v_coach_last_name, v_coach_avatar FROM public.profiles WHERE id = p_coach_id;

    INSERT INTO public.sessions (title, category, instructor, start_time, end_time, credit_cost, coach_image_url)
    VALUES ('Private with ' || v_coach_first_name, 'PRIVATE', TRIM(v_coach_first_name || ' ' || COALESCE(v_coach_last_name, '')), v_main_session_start, v_main_session_end, v_coach_cost, v_coach_avatar)
    RETURNING id INTO v_coach_session_id;
  END IF;

  -- 9. EXECUTE BOOKINGS
  FOREACH v_attendee_id IN ARRAY p_attendee_ids LOOP
    IF p_origin = 'facilities' THEN
      INSERT INTO public.registrations (session_id, user_id, attendee_id, credits_paid) VALUES (p_session_id, p_user_id, v_attendee_id, v_main_session_cost);
      v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'facility', 'success', true);
    END IF;
    IF v_coach_session_id IS NOT NULL THEN
      INSERT INTO public.registrations (session_id, user_id, attendee_id, credits_paid) VALUES (v_coach_session_id, p_user_id, v_attendee_id, v_coach_cost);
      v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'coach', 'success', true);
    END IF;
  END LOOP;

  -- 10. DEDUCT & LOG TRANSACTION
  UPDATE public.profiles SET credits = credits - v_total_cost WHERE id = p_user_id;
  INSERT INTO public.transactions (user_id, amount, type, description) 
  VALUES (p_user_id, -v_total_cost, 'booking', 'Atomic Booking: ' || v_main_session_title);

  RETURN jsonb_build_object('success', true, 'message', 'Booking successful', 'results', v_results);
END;
$$;


ALTER FUNCTION "public"."master_book_atomic"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_ids" "uuid"[], "p_coach_id" "uuid", "p_coach_tier" "text", "p_origin" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_sql"("sql_query" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;


ALTER FUNCTION "public"."run_sql"("sql_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_credits"("p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_from_credits int;
BEGIN
  IF p_amount <= 0 THEN RETURN json_build_object('success', false, 'message', 'Transfer amount must be positive'); END IF;
  SELECT credits INTO v_from_credits FROM profiles WHERE id = p_from_user_id FOR UPDATE;
  IF v_from_credits < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient credits');
  END IF;
  UPDATE profiles SET credits = credits - p_amount WHERE id = p_from_user_id;
  UPDATE profiles SET credits = credits + p_amount WHERE id = p_to_user_id;
  RETURN json_build_object('success', true, 'message', 'Transfer successful');
END;
$$;


ALTER FUNCTION "public"."transfer_credits"("p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "published" boolean DEFAULT false,
    "event_date" timestamp with time zone,
    "image_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "announcements_type_check" CHECK (("type" = ANY (ARRAY['news'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "is_recurring" boolean DEFAULT false,
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "player_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."coach_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_services" (
    "coach_id" "uuid" NOT NULL,
    "session_type_id" "uuid" NOT NULL
);


ALTER TABLE "public"."coach_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."golf_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "handicap" numeric(4,1) DEFAULT 0,
    "average_score" integer DEFAULT 0,
    "rounds_played" integer DEFAULT 0,
    "best_score" integer DEFAULT 0,
    "driver_distance" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."golf_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "post_id" bigint
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


ALTER TABLE "public"."likes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."likes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "content" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "shared_event_id" bigint
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "child_id" "uuid",
    "relationship_type" character varying(50) DEFAULT 'parent_child'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."player_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players_stats" (
    "id" bigint NOT NULL,
    "player_id" "uuid",
    "age" integer,
    "season" integer,
    "team" "text",
    "games_played_season" integer,
    "games_played_total" integer,
    "games_missed_healthy" integer,
    "games_missed_injured" integer,
    "goals_season" integer,
    "goals_total" integer,
    "assists_season" integer,
    "assists_total" integer,
    "gp" integer,
    "points" integer,
    "gwg" integer,
    "ppg" integer,
    "shg" integer,
    "pim" integer,
    "top_scorer_team" boolean,
    "top_scorer_league" boolean,
    "least_pim_team" boolean,
    "most_shots_team" boolean,
    "is_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."players_stats" OWNER TO "postgres";


ALTER TABLE "public"."players_stats" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."players_stats_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "image_url" "text",
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "shared_post_id" bigint
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "mobile" "text",
    "contact_email" "text",
    "avatar_url" "text",
    "bio" "text",
    "tier" "text" DEFAULT 'free'::"text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "credits" integer DEFAULT 100,
    "gallery_images" "text"[] DEFAULT '{}'::"text"[],
    "schedule_photo_url" "text",
    "role" "text" DEFAULT 'player'::"text",
    "parent_id" "uuid",
    "intro_video_url" "text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "team" "text",
    "position" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_managed" boolean DEFAULT false,
    "membership_tier" "text" DEFAULT 'individual'::"text",
    "membership_start" timestamp with time zone,
    "membership_expires" timestamp with time zone,
    "membership_history" "jsonb" DEFAULT '[]'::"jsonb",
    "account_status" "text" DEFAULT 'locked'::"text",
    CONSTRAINT "profiles_membership_tier_check" CHECK (("membership_tier" = ANY (ARRAY['individual'::"text", 'family_2'::"text", 'family_3plus'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['player'::"text", 'coach'::"text", 'parent'::"text", 'sys-admin'::"text"]))),
    CONSTRAINT "profiles_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'individual'::"text", 'family_2'::"text", 'family_3plus'::"text"])))
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."membership_start" IS 'Date when the user first became a member';



COMMENT ON COLUMN "public"."profiles"."membership_expires" IS 'Date when the current membership period ends';



COMMENT ON COLUMN "public"."profiles"."membership_history" IS 'Log of past renewals and tier changes';



CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" bigint NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "payer_id" "uuid",
    "credits_paid" integer DEFAULT 0
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


ALTER TABLE "public"."registrations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."registrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."session_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "description" "text",
    CONSTRAINT "session_types_category_check" CHECK (("category" = ANY (ARRAY['CLASS'::"text", 'PRIVATE'::"text", 'FACILITY'::"text"])))
);


ALTER TABLE "public"."session_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "instructor" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "image_url" "text",
    "coach_image_url" "text",
    "description" "text",
    "credit_cost" integer DEFAULT 10,
    "max_capacity" integer DEFAULT 10,
    "priority" integer DEFAULT 0,
    "total_facility_bays" integer DEFAULT 0,
    "session_type_id" "uuid",
    "capacity" integer DEFAULT 1
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sessions"."priority" IS 'Ordering priority for news/events. Higher values shown first.';



ALTER TABLE "public"."sessions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "amount" integer NOT NULL,
    "type" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "idempotency_key" "text",
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['topup'::"text", 'membership'::"text", 'transfer'::"text", 'booking'::"text", 'refund'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_commands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "command_text" "text" NOT NULL,
    "processed_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."voice_commands" OWNER TO "postgres";


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_services"
    ADD CONSTRAINT "coach_services_pkey" PRIMARY KEY ("coach_id", "session_type_id");



ALTER TABLE ONLY "public"."golf_stats"
    ADD CONSTRAINT "golf_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."golf_stats"
    ADD CONSTRAINT "golf_stats_player_id_key" UNIQUE ("player_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_relationships"
    ADD CONSTRAINT "player_relationships_parent_id_child_id_key" UNIQUE ("parent_id", "child_id");



ALTER TABLE ONLY "public"."player_relationships"
    ADD CONSTRAINT "player_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players_stats"
    ADD CONSTRAINT "players_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_user_id_session_id_key" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."session_types"
    ADD CONSTRAINT "session_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_commands"
    ADD CONSTRAINT "voice_commands_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_announcements_event_date" ON "public"."announcements" USING "btree" ("event_date") WHERE ("type" = 'event'::"text");



CREATE INDEX "idx_announcements_published" ON "public"."announcements" USING "btree" ("published", "created_at" DESC);



CREATE INDEX "idx_announcements_type" ON "public"."announcements" USING "btree" ("type");



CREATE INDEX "idx_availability_coach_id_time" ON "public"."availability" USING "btree" ("coach_id", "start_time");



CREATE INDEX "idx_profiles_membership_tier" ON "public"."profiles" USING "btree" ("membership_tier");



CREATE INDEX "idx_profiles_stripe_customer_id" ON "public"."profiles" USING "btree" ("stripe_customer_id");



COMMENT ON INDEX "public"."idx_profiles_stripe_customer_id" IS 'Optimizes Stripe webhook lookups';



CREATE INDEX "idx_registrations_session_id" ON "public"."registrations" USING "btree" ("session_id");



CREATE INDEX "idx_registrations_user_id" ON "public"."registrations" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_services"
    ADD CONSTRAINT "coach_services_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_services"
    ADD CONSTRAINT "coach_services_session_type_id_fkey" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."golf_stats"
    ADD CONSTRAINT "golf_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."player_relationships"
    ADD CONSTRAINT "player_relationships_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players_stats"
    ADD CONSTRAINT "players_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players_stats"
    ADD CONSTRAINT "players_stats_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "public"."posts"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_session_type_id_fkey" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voice_commands"
    ADD CONSTRAINT "voice_commands_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin All Coach Services" ON "public"."coach_services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'sys-admin'::"text")))));



CREATE POLICY "Admin All Session Types" ON "public"."session_types" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'sys-admin'::"text")))));



CREATE POLICY "Admin/Coach can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("public"."get_auth_role"() = ANY (ARRAY['admin'::"text", 'sys-admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admins can manage all announcements" ON "public"."announcements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'sys-admin'::"text") OR ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Admins can view all notes" ON "public"."coach_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"text") OR ("profiles"."role" = 'sys-admin'::"text"))))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = ANY (ARRAY['admin'::"text", 'sys-admin'::"text"]))))));



CREATE POLICY "Admins can view all transactions" ON "public"."transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'sys-admin'::"text"]))))));



CREATE POLICY "Coaches can manage own notes" ON "public"."coach_notes" USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Enable all access for everyone" ON "public"."coach_services" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."coach_services" FOR SELECT USING (true);



CREATE POLICY "Parent can view children profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can delete relationships" ON "public"."player_relationships" FOR DELETE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can insert relationships" ON "public"."player_relationships" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can view their relationships" ON "public"."player_relationships" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Public Profiles Access" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public Read Coach Services" ON "public"."coach_services" FOR SELECT USING (true);



CREATE POLICY "Public Read Session Types" ON "public"."session_types" FOR SELECT USING (true);



CREATE POLICY "Public can view announcements" ON "public"."announcements" FOR SELECT USING (true);



CREATE POLICY "Public can view coach profiles" ON "public"."profiles" FOR SELECT USING (("role" = 'coach'::"text"));



CREATE POLICY "Public can view golf stats" ON "public"."golf_stats" FOR SELECT USING (true);



CREATE POLICY "Public can view published announcements" ON "public"."announcements" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view session types" ON "public"."session_types" FOR SELECT USING (true);



CREATE POLICY "Public can view sessions" ON "public"."sessions" FOR SELECT USING (true);



CREATE POLICY "Users allow insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users allow update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own golf stats" ON "public"."golf_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "Users can update own golf stats" ON "public"."golf_stats" FOR UPDATE USING (("auth"."uid"() = "player_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."player_relationships"
  WHERE (("player_relationships"."parent_id" = "auth"."uid"()) AND ("player_relationships"."child_id" = "player_relationships"."id"))))));



CREATE POLICY "Users can view own registrations" ON "public"."registrations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."player_relationships"
  WHERE (("player_relationships"."parent_id" = "auth"."uid"()) AND ("player_relationships"."child_id" = "registrations"."user_id"))))));



CREATE POLICY "Users can view own stats" ON "public"."players_stats" FOR SELECT USING ((("auth"."uid"() = "player_id") OR (EXISTS ( SELECT 1
   FROM "public"."player_relationships"
  WHERE (("player_relationships"."parent_id" = "auth"."uid"()) AND ("player_relationships"."child_id" = "players_stats"."player_id"))))));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."player_relationships"
  WHERE (("player_relationships"."parent_id" = "auth"."uid"()) AND ("player_relationships"."child_id" = "transactions"."user_id"))))));



CREATE POLICY "View Own Bookings" ON "public"."registrations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "payer_id")));



CREATE POLICY "View Relationships" ON "public"."player_relationships" FOR SELECT USING ((("auth"."uid"() = "parent_id") OR ("auth"."uid"() = "child_id")));



ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."golf_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_public_read" ON "public"."sessions" FOR SELECT USING (true);



COMMENT ON POLICY "sessions_public_read" ON "public"."sessions" IS 'Allow all users to view sessions';



CREATE POLICY "sessions_service_role_all" ON "public"."sessions" USING (("auth"."role"() = 'service_role'::"text"));



COMMENT ON POLICY "sessions_service_role_all" ON "public"."sessions" IS 'Only admins can modify sessions';



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voice_commands" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."book_coach_atomic"("p_user_id" "uuid", "p_coach_id" "uuid", "p_session_id" bigint, "p_credit_cost" integer, "p_attendee_id" "uuid", "p_origin" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."book_coach_atomic"("p_user_id" "uuid", "p_coach_id" "uuid", "p_session_id" bigint, "p_credit_cost" integer, "p_attendee_id" "uuid", "p_origin" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_coach_atomic"("p_user_id" "uuid", "p_coach_id" "uuid", "p_session_id" bigint, "p_credit_cost" integer, "p_attendee_id" "uuid", "p_origin" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_session_and_refund"("p_attendee_id" "uuid", "p_session_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_session_and_refund"("p_attendee_id" "uuid", "p_session_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_session_and_refund"("p_attendee_id" "uuid", "p_session_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."master_book_atomic"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_ids" "uuid"[], "p_coach_id" "uuid", "p_coach_tier" "text", "p_origin" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."master_book_atomic"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_ids" "uuid"[], "p_coach_id" "uuid", "p_coach_tier" "text", "p_origin" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."master_book_atomic"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_ids" "uuid"[], "p_coach_id" "uuid", "p_coach_tier" "text", "p_origin" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_sql"("sql_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_sql"("sql_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_sql"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_credits"("p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_credits"("p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_credits"("p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."coach_notes" TO "anon";
GRANT ALL ON TABLE "public"."coach_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_notes" TO "service_role";



GRANT ALL ON TABLE "public"."coach_services" TO "anon";
GRANT ALL ON TABLE "public"."coach_services" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_services" TO "service_role";



GRANT ALL ON TABLE "public"."golf_stats" TO "anon";
GRANT ALL ON TABLE "public"."golf_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."golf_stats" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."player_relationships" TO "anon";
GRANT ALL ON TABLE "public"."player_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."player_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."players_stats" TO "anon";
GRANT ALL ON TABLE "public"."players_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."players_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_stats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_stats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_stats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("username") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("first_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("last_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("mobile") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("contact_email") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("bio") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("gallery_images") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("schedule_photo_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("intro_video_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("preferences") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("team") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("position") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."session_types" TO "anon";
GRANT ALL ON TABLE "public"."session_types" TO "authenticated";
GRANT ALL ON TABLE "public"."session_types" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."voice_commands" TO "anon";
GRANT ALL ON TABLE "public"."voice_commands" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_commands" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































revoke update on table "public"."profiles" from "authenticated";


  create policy "Authenticated Avatar Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public Avatars Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));




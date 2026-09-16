import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hzltndrltyseifwbmjeg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const dbUrl = process.env.DATABASE_URL || process.env.JRDUCKS_DATABASE_URL;

const JRDUCKS_DB_CONFIG = dbUrl ? {
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
} : {
  host: process.env.DB_HOST || 'db.hzltndrltyseifwbmjeg.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false }
};

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'sys-admin' | 'coach' | 'player' | 'parent';
  bio?: string;
  team?: string;
  position?: string;
  credits?: number;
  subscriptionStatus?: string;
}

const USERS_TO_SEED: SeedUser[] = [
  {
    email: 'admin@jrducks.com',
    password: 'JrDucks2026!Admin',
    firstName: 'Director',
    lastName: 'Jr Ducks',
    role: 'sys-admin',
    bio: 'Director of Hockey Operations • Anaheim Jr. Ducks',
    credits: 1000,
    subscriptionStatus: 'active'
  },
  {
    email: 'scott.niedermayer@jrducks.com',
    password: 'JrDucks2026!Coach',
    firstName: 'Scott',
    lastName: 'Niedermayer',
    role: 'coach',
    bio: 'Director of Player Development • Anaheim Jr. Ducks • 4x Stanley Cup Champion',
    credits: 500,
    subscriptionStatus: 'active'
  },
  {
    email: 'teemu.selanne@jrducks.com',
    password: 'JrDucks2026!Coach',
    firstName: 'Teemu',
    lastName: 'Selanne',
    role: 'coach',
    bio: 'Head Skills & Shooting Coach • Anaheim Jr. Ducks • Anaheim Ducks Franchise Legend',
    credits: 500,
    subscriptionStatus: 'active'
  },
  {
    email: 'trevor.zegras.jr@jrducks.com',
    password: 'JrDucks2026!Player',
    firstName: 'Trevor',
    lastName: 'Zegras Jr.',
    role: 'player',
    team: '14U AAA Anaheim Jr. Ducks',
    position: 'Center',
    bio: '14U AAA Anaheim Jr. Ducks Forward • Class of 2030',
    credits: 250,
    subscriptionStatus: 'active'
  }
];

async function seedJrDucksData() {
  console.log('🦆 Starting Anaheim Jr. Ducks Database Seeding...');
  console.log('Target Supabase:', SUPABASE_URL);

  const pgClient = new Client(JRDUCKS_DB_CONFIG);
  await pgClient.connect();
  console.log(' Connected directly to Postgres on db.hzltndrltyseifwbmjeg.supabase.co:5432');

  const createdUserIds: Record<string, string> = {};

  // 1. SEED AUTH USERS & PROFILES
  console.log('\n--- 1. Seeding Staff & Coach Accounts ---');
  for (const u of USERS_TO_SEED) {
    try {
      // Check if user already exists
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = listData?.users.find(usr => usr.email?.toLowerCase() === u.email.toLowerCase());

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        console.log(`ℹ️ User already exists in auth: ${u.email} (${userId})`);
      } else {
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            first_name: u.firstName,
            last_name: u.lastName,
            role: u.role
          }
        });

        if (createError) {
          console.error(`❌ Failed to create user ${u.email}:`, createError.message);
          continue;
        }
        userId = createData.user.id;
        console.log(`✅ Created Auth user: ${u.email} (${userId})`);
      }

      createdUserIds[u.email] = userId;

      // Ensure profile row is complete
      await pgClient.query(`
        INSERT INTO public.profiles (
          id, first_name, last_name, username, role, bio, team, position,
          credits, subscription_status, account_status, contact_email, membership_tier
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, 'individual'
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          bio = EXCLUDED.bio,
          team = EXCLUDED.team,
          position = EXCLUDED.position,
          credits = EXCLUDED.credits,
          subscription_status = EXCLUDED.subscription_status,
          account_status = 'active',
          contact_email = EXCLUDED.contact_email;
      `, [
        userId,
        u.firstName,
        u.lastName,
        u.email.split('@')[0],
        u.role,
        u.bio || null,
        u.team || null,
        u.position || null,
        u.credits || 0,
        u.subscriptionStatus || 'inactive',
        u.email
      ]);

      console.log(`   ✓ Profile synced for ${u.firstName} ${u.lastName} [${u.role}]`);
    } catch (err: any) {
      console.error(`❌ Error processing user ${u.email}:`, err.message);
    }
  }

  // 2. SEED JR DUCKS HOME FACILITIES & SCHEDULE SESSIONS
  console.log('\n--- 2. Seeding Jr. Ducks Home Facilities & Sessions ---');
  const coachScottId = createdUserIds['scott.niedermayer@jrducks.com'];
  const coachTeemuId = createdUserIds['teemu.selanne@jrducks.com'];

  // Base schedule dates starting tomorrow
  const now = new Date();
  const makeDate = (daysAhead: number, hour: number, minute: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const JRDUCKS_SESSIONS = [
    {
      title: 'AAA Bantam & Midget Power Skating & Edge Control',
      description: 'High-intensity stride mechanics, dynamic edge work, and change-of-direction acceleration with Director Scott Niedermayer.',
      start_time: makeDate(1, 16, 30),
      end_time: makeDate(1, 17, 45),
      instructor: 'Scott Niedermayer',
      coach_id: coachScottId,
      category: 'CLASS',
      credit_cost: 20,
      max_capacity: 18,
      bay_number: 1, // Rink 1 - FivePoint Arena
      image_url: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1200&q=80',
      coach_image_url: '/tenants/jrducks/logo.png'
    },
    {
      title: 'Elite Shooting, Release Angles & Deception Clinic',
      description: 'Quick release, off-catch snapshot mechanics, and goalie deception masterclass led by Teemu Selanne.',
      start_time: makeDate(2, 17, 0),
      end_time: makeDate(2, 18, 15),
      instructor: 'Teemu Selanne',
      coach_id: coachTeemuId,
      category: 'CLASS',
      credit_cost: 25,
      max_capacity: 16,
      bay_number: 2, // Olympic Rink - Anaheim ICE
      image_url: 'https://images.unsplash.com/photo-1515703407324-5f753eed2477?auto=format&fit=crop&w=1200&q=80',
      coach_image_url: '/tenants/jrducks/logo.png'
    },
    {
      title: 'PeeWee High-Tempo Puck Protection & Small Area Battles',
      description: 'Body positioning along the boards, puck shielding under pressure, and tight-area give-and-go execution.',
      start_time: makeDate(3, 18, 0),
      end_time: makeDate(3, 19, 15),
      instructor: 'Scott Niedermayer',
      coach_id: coachScottId,
      category: 'CLASS',
      credit_cost: 20,
      max_capacity: 20,
      bay_number: 1, // FivePoint Arena - Great Park Ice
      image_url: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1200&q=80',
      coach_image_url: '/tenants/jrducks/logo.png'
    },
    {
      title: 'Squirt ADM Skating Acceleration & Stride Mechanics',
      description: 'Foundational edge work, forward-to-backward transitions, and recovery stride development for squirt-level athletes.',
      start_time: makeDate(4, 15, 30),
      end_time: makeDate(4, 16, 45),
      instructor: 'Teemu Selanne',
      coach_id: coachTeemuId,
      category: 'CLASS',
      credit_cost: 15,
      max_capacity: 22,
      bay_number: 3, // Lakewood ICE
      image_url: 'https://images.unsplash.com/photo-1515703407324-5f753eed2477?auto=format&fit=crop&w=1200&q=80',
      coach_image_url: '/tenants/jrducks/logo.png'
    },
    {
      title: 'Defenseman Gap Control & Angling Lab',
      description: 'Stick-on-puck checking, backward mobility, blue line walking, and breakout reads for travel defensemen.',
      start_time: makeDate(5, 17, 30),
      end_time: makeDate(5, 18, 45),
      instructor: 'Scott Niedermayer',
      coach_id: coachScottId,
      category: 'CLASS',
      credit_cost: 20,
      max_capacity: 14,
      bay_number: 1, // Great Park Ice
      image_url: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1200&q=80',
      coach_image_url: '/tenants/jrducks/logo.png'
    }
  ];

  // Clear any placeholder sample sessions and insert fresh Jr Ducks schedule
  await pgClient.query(`DELETE FROM public.sessions WHERE category = 'CLASS';`);

  for (const s of JRDUCKS_SESSIONS) {
    await pgClient.query(`
      INSERT INTO public.sessions (
        title, description, start_time, end_time, instructor, coach_id,
        category, credit_cost, max_capacity, bay_number, image_url, coach_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
    `, [
      s.title, s.description, s.start_time, s.end_time, s.instructor, s.coach_id,
      s.category, s.credit_cost, s.max_capacity, s.bay_number, s.image_url, s.coach_image_url
    ]);
    console.log(`   ✓ Scheduled session: ${s.title}`);
  }

  // 3. SEED COACH AVAILABILITY BLOCKS
  console.log('\n--- 3. Seeding Coach Availability ---');
  if (coachScottId) {
    await pgClient.query(`
      INSERT INTO public.availability (coach_id, start_time, end_time, status)
      VALUES 
        ($1, $2, $3, 'available'),
        ($1, $4, $5, 'available');
    `, [
      coachScottId,
      makeDate(1, 14, 0), makeDate(1, 16, 0),
      makeDate(3, 15, 0), makeDate(3, 17, 0)
    ]);
    console.log('   ✓ Added availability blocks for Coach Scott Niedermayer');
  }

  if (coachTeemuId) {
    await pgClient.query(`
      INSERT INTO public.availability (coach_id, start_time, end_time, status)
      VALUES 
        ($1, $2, $3, 'available'),
        ($1, $4, $5, 'available');
    `, [
      coachTeemuId,
      makeDate(2, 14, 30), makeDate(2, 16, 30),
      makeDate(4, 13, 0), makeDate(4, 15, 0)
    ]);
    console.log('   ✓ Added availability blocks for Coach Teemu Selanne');
  }

  // 4. SEED WELCOME ANNOUNCEMENT
  console.log('\n--- 4. Seeding Welcome Announcements ---');
  const adminId = createdUserIds['admin@jrducks.com'];
  await pgClient.query(`
    INSERT INTO public.announcements (
      title, content, type, published, image_url, created_by
    ) VALUES (
      'Welcome to Anaheim Jr. Ducks Athlete & Family Portal',
      'Welcome to the official digital portal for Anaheim Jr. Ducks Hockey. Book development clinics, manage player stats, and track ice schedules across Great Park Ice & The Rinks.',
      'news',
      true,
      '/tenants/jrducks/logo.png',
      $1
    ) ON CONFLICT DO NOTHING;
  `, [adminId || null]);
  console.log('   ✓ Seeded official welcome announcement');

  await pgClient.end();
  console.log('\n🎉 Anaheim Jr. Ducks Seeding Complete!');
}

seedJrDucksData().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

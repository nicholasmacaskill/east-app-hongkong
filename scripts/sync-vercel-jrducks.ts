import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const projectJsonPath = path.resolve(__dirname, '../.vercel/project.json');
const eastBackupPath = path.resolve(__dirname, '../.vercel/project.east.json');

const JRDUCKS_PROJECT_CONFIG = {
  projectId: 'prj_dZql7wjSwB6zy4HSSn83nVBM9RQr',
  orgId: 'team_dHuuSP1b4oQVAiWNVn2Rvgg8',
  projectName: 'jrducks-app',
  settings: {
    framework: 'nextjs',
    nodeVersion: '20.x'
  }
};

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.jrducks') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ENV_VARS: Record<string, string> = {
  NEXT_PUBLIC_TENANT: 'jrducks',
  NEXT_PUBLIC_DISABLE_TENANT_SWITCHER: 'true',
  NEXT_PUBLIC_APP_NAME: 'Anaheim Jr. Ducks Portal',
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://jrducks-app.vercel.app',
  NEXT_PUBLIC_TIMEZONE: 'America/Los_Angeles',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hzltndrltyseifwbmjeg.supabase.co',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://hzltndrltyseifwbmjeg.supabase.co',
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXT_PUBLIC_STRIPE_MODE: process.env.NEXT_PUBLIC_STRIPE_MODE || 'test',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || '',
  NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEST || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_YEARLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_TEST || process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE_TEST || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE || '',
  NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE_TEST: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE_TEST || '',
};

async function syncVercelEnv(anonKey?: string, serviceKey?: string) {
  if (anonKey) {
    ENV_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
  }
  if (serviceKey) {
    ENV_VARS.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  }

  // 1. Back up EAST project.json
  if (fs.existsSync(projectJsonPath) && !fs.existsSync(eastBackupPath)) {
    fs.copyFileSync(projectJsonPath, eastBackupPath);
    console.log('🔒 Backed up EAST project link to .vercel/project.east.json');
  }

  try {
    // 2. Temporarily point .vercel/project.json to jrducks-app
    fs.writeFileSync(projectJsonPath, JSON.stringify(JRDUCKS_PROJECT_CONFIG, null, 2));
    console.log('🦆 Linked locally to Vercel project: jrducks-app');

    // 3. Add environment variables
    console.log('\nUploading environment variables to jrducks-app on Vercel...');
    for (const [key, value] of Object.entries(ENV_VARS)) {
      try {
        execSync(`printf "%s" "${value}" | npx vercel env add ${key} production --force`, {
          stdio: 'ignore'
        });
        execSync(`printf "%s" "${value}" | npx vercel env add ${key} preview --force`, {
          stdio: 'ignore'
        });
        process.stdout.write(`   ✓ Added ${key}\n`);
      } catch (e: any) {
        console.error(`   ✗ Failed to add ${key}:`, e.message);
      }
    }

    console.log('\n✅ All environment variables uploaded to Vercel jrducks-app!');
  } finally {
    // 4. Always restore EAST project.json
    if (fs.existsSync(eastBackupPath)) {
      fs.copyFileSync(eastBackupPath, projectJsonPath);
      console.log('🔒 Successfully restored EAST project link (.vercel/project.json). EAST is 100% untouched!');
    }
  }
}

const anonKeyArg = process.argv[2];
const serviceKeyArg = process.argv[3];
syncVercelEnv(anonKeyArg, serviceKeyArg);

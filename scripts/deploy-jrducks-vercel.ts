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

async function deployJrDucks() {
  console.log('🚀 Deploying Anaheim Jr. Ducks to Vercel (Isolated Project)...');

  // 1. Back up EAST project.json
  if (fs.existsSync(projectJsonPath) && !fs.existsSync(eastBackupPath)) {
    fs.copyFileSync(projectJsonPath, eastBackupPath);
    console.log('🔒 Backed up EAST project link to .vercel/project.east.json');
  }

  try {
    // 2. Point .vercel/project.json to jrducks-app
    fs.writeFileSync(projectJsonPath, JSON.stringify(JRDUCKS_PROJECT_CONFIG, null, 2));
    console.log('🦆 Linked locally to Vercel project: jrducks-app');

    // 3. Deploy to production
    console.log('⏳ Running `vercel deploy --prod --yes`...');
    const output = execSync('npx vercel deploy --prod --yes', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log('✅ Deployment complete!');
    console.log(output);

    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
    if (match) {
      console.log('\n🎉 Live URL:', match[0]);
    }
  } catch (err: any) {
    console.error('❌ Deployment error:', err.stdout || err.message);
  } finally {
    // 4. Always restore EAST project.json
    if (fs.existsSync(eastBackupPath)) {
      fs.copyFileSync(eastBackupPath, projectJsonPath);
      console.log('🔒 Successfully restored EAST project link (.vercel/project.json). EAST is 100% untouched!');
    }
  }
}

deployJrDucks();

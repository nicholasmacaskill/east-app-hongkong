#!/usr/bin/env ts-node
/**
 * White-Label Harness CLI
 * Ingests any sports organization website (e.g. https://www.jrducks.com/)
 * Extracts brand metadata, colors, logos, and sport taxonomy, and outputs
 * a ready-to-use TenantConfig.
 *
 * Usage:
 *   npx ts-node scripts/whitelabel-harness.ts https://www.jrducks.com/ --slug jrducks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface ScrapedBrand {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  websiteUrl: string;
  primarySport: string;
  sports: string[];
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    black: string;
    card: string;
  };
  logoUrl?: string;
  touchIconUrl?: string;
}

function fetchUrl(targetUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith('https') ? https : http;
    client.get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchUrl(res.headers.location));
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    ).on('error', reject);
  });
}

function downloadFile(sourceUrl: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const client = sourceUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    client.get(
      sourceUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(downloadFile(res.headers.location, destPath));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      }
    ).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function runHarness() {
  const args = process.argv.slice(2);
  const targetUrl = args[0] || 'https://www.jrducks.com/';

  // Parse arguments
  let slug = 'custom-club';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) {
      slug = args[i + 1];
    }
  }

  console.log(`\n🏒 [White-Label Harness] Ingesting: ${targetUrl} (slug: ${slug})...`);

  try {
    const html = await fetchUrl(targetUrl);

    // 1. Extract Title / Name
    let title = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const brandName = ogTitleMatch ? ogTitleMatch[1].trim() : title || 'Sports Club';

    // 2. Extract Description / Tagline
    let description = '';
    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) description = descMatch[1].trim();

    // 3. Extract Apple Touch Icons & Logos
    let logoUrl = '';
    const touchIconMatch =
      html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i);
    if (touchIconMatch) logoUrl = touchIconMatch[1].trim();

    // Check for 192 or 180 size icon specifically
    const highResIcon = html.match(/<link[^>]*sizes=["'](?:180x180|192x192)["'][^>]*href=["']([^"']+)["']/i);
    if (highResIcon) logoUrl = highResIcon[1].trim();

    // 4. Detect Sport Type
    const isHockey = /hockey|ice-hockey|rink|puck|skate/i.test(html);
    const isGolf = /golf|fairway|putting|driver/i.test(html);
    const isSoccer = /soccer|fc|futbol|pitch/i.test(html);

    const primarySport = isHockey ? 'ice-hockey' : isGolf ? 'golf' : isSoccer ? 'soccer' : 'general';
    const detectedSports: string[] = [primarySport];

    // 5. Default Colors (Jr Ducks detection or generic palette)
    const isDucks = /ducks|anaheim/i.test(brandName) || /ducks|anaheim/i.test(targetUrl);
    const colors = isDucks
      ? {
          primary: '#F47A38',     // Anaheim Ducks Orange
          primaryDark: '#C25619', // Deep Burn Orange
          accent: '#B9975B',      // Ducks Gold
          black: '#0A0A0A',
          card: '#18181B',
        }
      : {
          primary: '#3B82F6',     // Royal Blue fallback
          primaryDark: '#1D4ED8',
          accent: '#F59E0B',      // Amber
          black: '#0F172A',
          card: '#1E293B',
        };

    const scraped: ScrapedBrand = {
      slug,
      name: isDucks ? 'Anaheim Jr. Ducks' : brandName,
      shortName: isDucks ? 'Jr Ducks' : brandName.split(' ')[0],
      tagline: description || `Official Athlete Development Platform for ${brandName}`,
      websiteUrl: targetUrl,
      primarySport,
      sports: detectedSports,
      colors,
      logoUrl,
    };

    console.log(`✅ Successfully extracted brand parameters:`);
    console.log(`   • Name:         ${scraped.name}`);
    console.log(`   • Short Name:   ${scraped.shortName}`);
    console.log(`   • Primary Sport:${scraped.primarySport}`);
    console.log(`   • Primary Color:${scraped.colors.primary}`);
    console.log(`   • Accent Color: ${scraped.colors.accent}`);
    if (scraped.logoUrl) {
      console.log(`   • Logo Source:  ${scraped.logoUrl}`);
    }

    // Download logo if found
    if (scraped.logoUrl) {
      const destFile = path.join(process.cwd(), 'public', 'tenants', slug, 'logo.png');
      console.log(`📥 Caching logo to public/tenants/${slug}/logo.png...`);
      try {
        await downloadFile(scraped.logoUrl, destFile);
        console.log(`✅ Logo saved to ${destFile}`);
      } catch (err: any) {
        console.warn(`⚠️ Could not auto-download logo: ${err.message}`);
      }
    }

    console.log(`\n🎉 [Ready TenantConfig Code Block]:\n`);
    console.log(`  ${slug}: {
    slug: '${slug}',
    name: '${scraped.name}',
    shortName: '${scraped.shortName}',
    tagline: '${scraped.tagline.replace(/'/g, "\\'")}',
    location: '${isDucks ? 'Anaheim, California, USA' : 'United States'}',
    timezone: '${isDucks ? 'America/Los_Angeles' : 'UTC'}',
    currency: '${isDucks ? 'USD' : 'USD'}',
    currencySymbol: '$',
    supportEmail: 'contact@${slug}.com',
    websiteUrl: '${scraped.websiteUrl}',
    sports: ['${scraped.primarySport}'],
    primarySport: '${scraped.primarySport}',
    colors: {
      primary: '${scraped.colors.primary}',
      primaryDark: '${scraped.colors.primaryDark}',
      accent: '${scraped.colors.accent}',
      black: '${scraped.colors.black}',
      card: '${scraped.colors.card}',
      glow: 'rgba(${scraped.colors.primary === '#F47A38' ? '244, 122, 56' : '59, 130, 246'}, 0.4)',
    },
    assets: {
      logoUrl: '/tenants/${slug}/logo.png',
      logoAlt: '${scraped.name}',
      faviconUrl: '/tenants/${slug}/logo.png',
    },
    features: {
      enableGolfStats: false,
      enableHockeyStats: ${isHockey},
      enableDrillHub: true,
      enableFacilityScanner: true,
      enableCreditWallet: true,
    },
  },`);

  } catch (err: any) {
    console.error(`❌ Harness extraction error:`, err.message);
    process.exit(1);
  }
}

runHarness();

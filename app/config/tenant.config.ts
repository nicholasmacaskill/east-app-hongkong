export interface TenantColors {
  primary: string;         // Main brand color (e.g. #28D160 neon green for East, #F47A38 Ducks orange)
  primaryDark: string;     // Darker variant for hover/accents (e.g. #146B31 for East, #C25619 for Ducks)
  accent: string;          // Secondary highlight (e.g. #B9975B Ducks Gold)
  black: string;           // Base dark background (e.g. #121212 or #0A0A0A)
  card: string;            // Card surface background (e.g. #1E1E1E or #18181B)
  glow: string;            // CSS glow box-shadow color (e.g. rgba(40, 209, 96, 0.4) or rgba(244, 122, 56, 0.4))
}

export interface TenantAssets {
  logoUrl: string;
  logoAlt: string;
  faviconUrl?: string;
  bannerUrl?: string;
}

export interface TenantFeatures {
  enableGolfStats: boolean;
  enableHockeyStats: boolean;
  enableDrillHub: boolean;
  enableFacilityScanner: boolean;
  enableCreditWallet: boolean;
}

export interface TenantConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  location: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  supportEmail: string;
  websiteUrl: string;
  sports: ('ice-hockey' | 'golf' | 'lacrosse' | 'soccer' | 'basketball' | 'general')[];
  primarySport: string;
  colors: TenantColors;
  assets: TenantAssets;
  features: TenantFeatures;
}

export const TENANT_PRESETS: Record<string, TenantConfig> = {
  east: {
    slug: 'east',
    name: 'EAST Sports Group',
    shortName: 'EAST',
    tagline: 'High-Performance Athlete Development',
    location: 'Hong Kong',
    timezone: 'Asia/Hong_Kong',
    currency: 'HKD',
    currencySymbol: 'HK$',
    supportEmail: 'contact@eastsportsgroup.com',
    websiteUrl: 'https://app.eastsportsgroup.com',
    sports: ['ice-hockey', 'golf'],
    primarySport: 'ice-hockey',
    colors: {
      primary: '#28D160',
      primaryDark: '#146B31',
      accent: '#28D160',
      black: '#121212',
      card: '#1E1E1E',
      glow: 'rgba(40, 209, 96, 0.4)',
    },
    assets: {
      logoUrl: '/east-logo-transparent.png',
      logoAlt: 'EAST Sports Group',
      faviconUrl: '/favicon.ico',
    },
    features: {
      enableGolfStats: true,
      enableHockeyStats: true,
      enableDrillHub: true,
      enableFacilityScanner: true,
      enableCreditWallet: true,
    },
  },
  jrducks: {
    slug: 'jrducks',
    name: 'Anaheim Jr. Ducks',
    shortName: 'Jr Ducks',
    tagline: 'Premier Youth Hockey Development in Southern California',
    location: 'Anaheim, California, USA',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    currencySymbol: '$',
    supportEmail: 'info@jrducks.com',
    websiteUrl: 'https://www.jrducks.com',
    sports: ['ice-hockey'],
    primarySport: 'ice-hockey',
    colors: {
      primary: '#F47A38',      // Anaheim Ducks Official Orange
      primaryDark: '#C25619',  // Deep Burn Orange
      accent: '#B9975B',       // Anaheim Ducks Official Gold/Bronze
      black: '#0A0A0A',        // Jet Black
      card: '#18181B',         // Dark Zinc Card
      glow: 'rgba(244, 122, 56, 0.4)',
    },
    assets: {
      logoUrl: '/tenants/jrducks/logo.png',
      logoAlt: 'Anaheim Jr. Ducks Hockey',
      faviconUrl: '/tenants/jrducks/logo.png',
    },
    features: {
      enableGolfStats: false,  // Pure ice hockey
      enableHockeyStats: true,
      enableDrillHub: true,
      enableFacilityScanner: true,
      enableCreditWallet: true,
    },
  },
};

export const DEFAULT_TENANT_SLUG = 'east';

/**
 * Resolves tenant configuration by slug with fallback to default (east)
 */
/**
 * Converts a hex color string to space-separated RGB channel values (for Tailwind alpha value support)
 * Example: "#28D160" -> "40 209 96"
 */
export function hexToRgbChannels(hex: string): string {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r} ${g} ${b}`;
  }
  const bigint = parseInt(cleanHex, 16);
  if (isNaN(bigint)) {
    return '40 209 96';
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}

/**
 * Resolves tenant configuration by slug with fallback to default (east)
 */
export function getTenantConfig(slug?: string | null): TenantConfig {
  if (slug && TENANT_PRESETS[slug.toLowerCase()]) {
    return TENANT_PRESETS[slug.toLowerCase()];
  }
  return TENANT_PRESETS[DEFAULT_TENANT_SLUG];
}

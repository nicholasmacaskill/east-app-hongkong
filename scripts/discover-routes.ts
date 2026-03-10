import fs from 'fs';
import path from 'path';

/**
 * Recursively discovers valid routes from the app directory.
 * Ignores API routes, dynamic segments [id], and layout/error files.
 */
export function discoverRoutes(dir: string, baseRoute = ''): string[] {
    const routes: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Ignore API routes and special next.js folders
            if (item === 'api' || item.startsWith('(') || item === '_components') continue;

            // Handle dynamic routes by skipping them for automated crawl (wait for explicit testing)
            if (item.startsWith('[') && item.endsWith(']')) continue;

            const nextRoute = baseRoute === '/' ? `/${item}` : `${baseRoute}/${item}`;
            routes.push(...discoverRoutes(fullPath, nextRoute));
        } else if (item === 'page.tsx' || item === 'page.js') {
            routes.push(baseRoute === '' ? '/' : baseRoute);
        }
    }

    // Deduplicate and filter out internal segments
    return [...new Set(routes)].filter(r => !r.includes('/(auth)') && !r.includes('/_'));
}

if (require.main === module) {
    const appDir = path.join(process.cwd(), 'app');
    const routes = discoverRoutes(appDir);
    console.log('Discovered Routes:');
    console.log(JSON.stringify(routes, null, 2));
}

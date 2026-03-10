import { Page, expect } from '@playwright/test';

export class MobileAuditEngine {
    constructor(private page: Page) { }

    /**
     * Checks for horizontal overflow (the "golden rule" of mobile)
     */
    async checkOverflow() {
        const overflow = await this.page.evaluate(() => {
            const doc = document.documentElement;
            return doc.scrollWidth > window.innerWidth;
        });

        if (overflow) {
            const wideElements = await this.page.evaluate(() => {
                const elements = [];
                document.querySelectorAll('*').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > window.innerWidth) {
                        elements.push(`${el.tagName}.${el.className} (${rect.width}px > ${window.innerWidth}px)`);
                    }
                });
                return elements;
            });
            console.warn(`Overflow detected on ${this.page.url()}:`, wideElements);
        }

        expect(overflow, `Horizontal overflow detected on ${this.page.url()}`).toBe(false);
    }

    /**
     * Checks for common CSS "Optimality" issues on mobile
     */
    async checkCSSOptimality() {
        const issues = await this.page.evaluate(() => {
            const findings: string[] = [];
            const viewportWidth = window.innerWidth;

            document.querySelectorAll('*').forEach(el => {
                if (!(el instanceof HTMLElement)) return;
                const style = window.getComputedStyle(el);

                // 1. Fixed width pixel abuse
                const width = style.width;
                if (width.endsWith('px')) {
                    const pxValue = parseFloat(width);
                    if (pxValue > viewportWidth * 0.9 && pxValue > 320) {
                        findings.push(`Fixed width: ${el.tagName}.${el.className.split(' ').join('.')} (${width})`);
                    }
                }

                // 2. Non-stacking flex rows
                if (style.display === 'flex' && style.flexDirection === 'row' && style.flexWrap === 'nowrap') {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > viewportWidth * 0.8 && el.children.length > 2) {
                        findings.push(`Risky Horizontal Flex: ${el.tagName}.${el.className.split(' ').join('.')} (width ${rect.width}px)`);
                    }
                }

                // 3. Tiny font sizes
                const fontSize = parseFloat(style.fontSize);
                if (fontSize < 12 && el.innerText.trim().length > 0) {
                    findings.push(`Small Font: ${el.tagName} (${fontSize}px)`);
                }
            });
            return findings;
        });

        if (issues.length > 0) {
            console.warn(`CSS Optimality warnings for ${this.page.url()}:`, issues);
        }
        // We don't necessarily fail on all optimality issues, but we log them.
        // In a stricter CI, we might expect(issues.length).toBeLessThan(X);
    }

    /**
     * Checks for Cumulative Layout Shift (CLS)
     */
    async checkLayoutStability() {
        const cls = await this.page.evaluate(async () => {
            let score = 0;
            return new Promise<number>((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            score += (entry as any).value;
                        }
                    }
                });
                observer.observe({ type: 'layout-shift', buffered: true });
                // Wait for stable state
                setTimeout(() => {
                    observer.disconnect();
                    resolve(score);
                }, 2000);
            });
        });

        if (cls > 0.1) {
            console.warn(`High CLS detected on ${this.page.url()}: ${cls}`);
        }
        expect(cls, `Cumulative Layout Shift too high on ${this.page.url()}`).toBeLessThan(0.25);
    }
}

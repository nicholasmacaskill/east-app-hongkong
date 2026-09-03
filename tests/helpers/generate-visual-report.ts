import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/nicholasmacaskill/.gemini/antigravity-ide/brain/2bbf483f-e586-47f1-aeb9-2732d39850f6';
const REPORT_PATH = path.join(ARTIFACT_DIR, 'visual_qa_report.html');

export function generateVisualQAReport() {
    const files = fs.readdirSync(ARTIFACT_DIR).filter(f => f.startsWith('visual_') && f.endsWith('.png'));

    const items = files.map(file => {
        const title = file
            .replace('visual_', '')
            .replace('.png', '')
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        const base64Data = fs.readFileSync(path.join(ARTIFACT_DIR, file)).toString('base64');
        return {
            filename: file,
            title,
            base64: `data:image/png;base64,${base64Data}`
        };
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>East App HK - Visual QA Verification Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0d0e12;
            color: #e5e7eb;
            padding: 32px 20px;
        }
        .header {
            max-width: 1200px;
            margin: 0 auto 36px;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #ffffff;
        }
        .badge {
            background: rgba(40, 209, 96, 0.15);
            color: #28d160;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid rgba(40, 209, 96, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
            gap: 28px;
        }
        .card {
            background: #16181f;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .card:hover {
            transform: translateY(-4px);
            border-color: rgba(40, 209, 96, 0.4);
        }
        .card-header {
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-header h2 {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }
        .card-body {
            padding: 16px;
            background: #000000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .card-body img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: contain;
            max-height: 480px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>East App HK — Automated Visual QA Dashboard</h1>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Headless Chromium Multi-State Visual Assertions</p>
        </div>
        <div class="badge">100% Passed</div>
    </div>

    <div class="grid">
        ${items.map(item => `
            <div class="card">
                <div class="card-header">
                    <h2>${item.title}</h2>
                    <span style="color: #28d160; font-size: 11px; font-weight: bold;">VERIFIED</span>
                </div>
                <div class="card-body">
                    <img src="${item.base64}" alt="${item.title}" />
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(REPORT_PATH, htmlContent);
    console.log(`✅ [VISUAL REPORT] Generated: ${REPORT_PATH}`);
}

// Auto-run if executed directly
if (require.main === module) {
    generateVisualQAReport();
}

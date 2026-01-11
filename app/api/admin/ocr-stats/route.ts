// app/api/admin/ocr-stats/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { imageBase64 } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const prompt = `Analyze this hockey stats card and extract ALL visible statistics.

Return a JSON object with these exact fields (set to null if not visible):

{
  "age": number or null,
  "season": number or null,
  "team": "string" or null,
  "games_played_season": number or null,
  "games_played_total": number or null,
  "games_missed_healthy": number or null,
  "games_missed_injured": number or null,
  "goals_season": number or null,
  "goals_total": number or null,
  "assists_season": number or null,
  "assists_total": number or null,
  "gp": number or null,
  "goals": number or null,
  "assists": number or null,
  "points": number or null,
  "gwg": number or null,
  "ppg": number or null,
  "shg": number or null,
  "pim": number or null
}

IMPORTANT: 
- Extract ONLY numbers and text visible on the card
- If a field is not visible or unclear, return null
- Return valid JSON only, no explanations`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageBase64
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 500
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        const parsedStats = JSON.parse(content);

        return NextResponse.json({
            success: true,
            stats: parsedStats
        });

    } catch (error: any) {
        console.error('OCR Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to process image'
        }, { status: 500 });
    }
}

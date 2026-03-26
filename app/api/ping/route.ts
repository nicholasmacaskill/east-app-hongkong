import { NextResponse } from 'next/server';
export async function GET() {
    return NextResponse.json({ pong: true, time: new Date().toISOString() });
}

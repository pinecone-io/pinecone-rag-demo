import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import checkRequiredEnvVars from '@/utils/requiredEnvVars';

export function middleware(_request: NextRequest) {
    try {
        checkRequiredEnvVars();
    } catch (error: unknown) {
        if (error instanceof Error) {
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })
        }
    }
    return NextResponse.next()
}

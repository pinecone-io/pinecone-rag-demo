import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({});

export const config = {
    matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

// export function middleware(request: NextRequest) {
//     const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_REGION', 'PINECONE_INDEX'];
//     requiredEnvVars.forEach(envVar => {
//         if (!process.env[envVar] && !process.env.CI) {
//             throw new Error(`${envVar} environment variable is not defined`);
//         }
//     });
//     return NextResponse.next()
// }
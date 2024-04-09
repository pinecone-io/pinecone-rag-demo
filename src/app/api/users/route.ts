import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient } from '@clerk/nextjs';

import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs'
import { currentUser } from '@clerk/nextjs';

export async function POST(req: NextRequest, res: NextResponse) {  
  try {
    
    const user = await currentUser();    

    if (!user) {
      return NextResponse.json({ success: false,
        error: 'Not allowed' });
    }
    
    // Check if the user has private metadata with admin set to true
    if (user.privateMetadata?.admin) {
      const users = await clerkClient.users.getUserList();
      return NextResponse.json(users);
    } else {
      // Respond with a "not allowed" error if the user doesn't have the required private metadata
      return NextResponse.json({ success: false,
        error: 'Not allowed' });
    }
  } catch (error) {
    return NextResponse.json({ success: false,
      error: 'Failed processing request' });
  }
}
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        emailVerified: false 
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      emailVerified: user.emailVerified || false 
    });
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false,
      emailVerified: false 
    });
  }
}
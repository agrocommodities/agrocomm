import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.id, userId),
    });

    return NextResponse.json({ valid: !!user });
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
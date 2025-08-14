import { NextResponse } from "next/server";
import { checkUserSubscription } from "@/lib/subscription";

export async function GET() {
  try {
    const result = await checkUserSubscription();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao verificar status da assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
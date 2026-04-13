import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

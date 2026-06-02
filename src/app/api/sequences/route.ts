import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-context";
import { listSequences } from "@/db/sequences";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sequences = await listSequences(ctx.orgId);
  return NextResponse.json({
    sequences: sequences.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isActive: s.isActive,
      emailSteps: s.steps.filter((st) => st.kind === "email").length,
      totalDays: s.steps
        .filter((st) => st.kind === "wait")
        .reduce((sum, st) => sum + (st.waitDays ?? 0), 0),
      enrollmentCount: s.enrollmentCount,
    })),
  });
}

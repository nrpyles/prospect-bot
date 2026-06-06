import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, fetchUserEmail } from "@/lib/gmail";
import { getUserContext } from "@/lib/server-context";
import { saveGmailConnection } from "@/db/connections";

export const runtime = "nodejs";

function settingsRedirect(status: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL(`/app/settings?gmail=${status}`, base));
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.redirect(
      new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return settingsRedirect("denied");
  if (!code || !state) return settingsRedirect("missing_code");

  // CSRF check
  const cookieStore = await cookies();
  const savedState = cookieStore.get("g_oauth_state")?.value;
  cookieStore.delete("g_oauth_state");
  if (!savedState || savedState !== state) {
    return settingsRedirect("bad_state");
  }

  try {
    const ctx = await getUserContext();
    if (!ctx) return settingsRedirect("no_user");

    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchUserEmail(tokens.accessToken);

    await saveGmailConnection(
      ctx.userId,
      tokens,
      email ?? "",
      email ?? `gmail_${ctx.userId.slice(0, 8)}`,
    );

    return settingsRedirect("connected");
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return settingsRedirect("error");
  }
}

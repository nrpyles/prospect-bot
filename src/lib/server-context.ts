/**
 * Server-side helper: resolves the current Clerk user into our DB user/org.
 * Use this at the top of any authenticated server component or route handler
 * to get the orgId for scoping queries.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserAndOrg } from "@/db/users";

export async function getUserContext() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return ensureUserAndOrg({
    clerkId,
    email,
    name: user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : null,
    imageUrl: user.imageUrl,
  });
}

/**
 * Server-side helper: resolves the current Clerk user into our DB user/org.
 * Use this at the top of any authenticated server component or route handler
 * to get the orgId for scoping queries.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { isPrimaryOwner, PRIMARY_OWNER_EMAIL } from "./private-access";
import { ensureUserAndOrg } from "@/db/users";
import {classifyWorkspaceFailure,WorkspaceSetupError} from "./workspace-setup";

export async function getUserContext() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await currentUser();
  if (!user) return null;

  const verifiedEmails = user.emailAddresses
    .filter(address=>address.verification?.status === "verified")
    .map(address=>address.emailAddress);
  if (!isPrimaryOwner({clerkId, verifiedEmails})) return null;

  try {
    return await ensureUserAndOrg({
      clerkId,
      email: PRIMARY_OWNER_EMAIL,
      name: user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : null,
      imageUrl: user.imageUrl,
    });
  } catch(error) {
    const code=classifyWorkspaceFailure(error,Boolean(process.env.DATABASE_URL));
    console.error('Private CRM workspace initialization failed',{code});
    throw new WorkspaceSetupError(code);
  }
}


/**
 * User OAuth connection storage (Gmail). Tokens encrypted at rest.
 */
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { userConnections } from "./schema";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { refreshAccessToken, type GoogleTokens } from "@/lib/gmail";

function ensureDb() {
  if (!db) throw new Error("DATABASE_URL is not set");
  return db;
}

export async function saveGmailConnection(
  userId: string,
  tokens: GoogleTokens,
  emailAddress: string,
  providerAccountId: string,
) {
  const conn = ensureDb();

  const values = {
    userId,
    provider: "gmail",
    providerAccountId,
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    expiresAt: tokens.expiresAt,
    scope: tokens.scope,
    emailAddress,
  };

  // Upsert on (userId, provider, providerAccountId)
  await conn
    .insert(userConnections)
    .values(values)
    .onConflictDoUpdate({
      target: [
        userConnections.userId,
        userConnections.provider,
        userConnections.providerAccountId,
      ],
      set: {
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
        expiresAt: values.expiresAt,
        scope: values.scope,
        emailAddress: values.emailAddress,
      },
    });
}

export type GmailConnectionInfo = {
  emailAddress: string | null;
  connectedAt: Date;
};

export async function getGmailConnectionInfo(userId: string): Promise<GmailConnectionInfo | null> {
  const conn = ensureDb();
  const [row] = await conn
    .select({
      emailAddress: userConnections.emailAddress,
      createdAt: userConnections.createdAt,
    })
    .from(userConnections)
    .where(and(eq(userConnections.userId, userId), eq(userConnections.provider, "gmail")))
    .limit(1);
  if (!row) return null;
  return { emailAddress: row.emailAddress, connectedAt: row.createdAt };
}

export async function deleteGmailConnection(userId: string) {
  const conn = ensureDb();
  await conn
    .delete(userConnections)
    .where(and(eq(userConnections.userId, userId), eq(userConnections.provider, "gmail")));
}

/**
 * Returns a valid (refreshed if needed) access token + the sender email
 * for the user's Gmail connection, or null if not connected.
 */
export async function getValidGmailAccessToken(
  userId: string,
): Promise<{ accessToken: string; emailAddress: string | null } | null> {
  const conn = ensureDb();
  const [row] = await conn
    .select()
    .from(userConnections)
    .where(and(eq(userConnections.userId, userId), eq(userConnections.provider, "gmail")))
    .limit(1);
  if (!row) return null;

  const accessToken = decryptSecret(row.accessToken);
  const refreshToken = decryptSecret(row.refreshToken);
  const expiresAt = row.expiresAt ?? new Date(0);

  // Token still valid (with margin)?
  if (accessToken && expiresAt.getTime() > Date.now() + 30_000) {
    return { accessToken, emailAddress: row.emailAddress };
  }

  // Need to refresh
  if (!refreshToken) {
    // No refresh token — can't recover. Caller should prompt reconnect.
    return null;
  }

  const refreshed = await refreshAccessToken(refreshToken);

  await conn
    .update(userConnections)
    .set({
      accessToken: encryptSecret(refreshed.accessToken),
      // keep existing refresh token unless Google returned a new one
      refreshToken: refreshed.refreshToken
        ? encryptSecret(refreshed.refreshToken)
        : row.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: refreshed.scope || row.scope,
    })
    .where(eq(userConnections.id, row.id));

  return { accessToken: refreshed.accessToken, emailAddress: row.emailAddress };
}

/**
 * Lightweight symmetric encryption for OAuth tokens at rest.
 *
 * Uses AES-256-GCM with a key derived from TOKEN_ENCRYPTION_KEY (or, as a
 * dev fallback, CLERK_SECRET_KEY so something is always available). If no
 * secret is present at all, values pass through unencrypted with a prefix
 * marker so we can still read them back — acceptable only in local dev.
 */
import crypto from "node:crypto";

const ENC_PREFIX = "enc:v1:";
const PLAIN_PREFIX = "plain:v1:";

function getKey(): Buffer | null {
  const secret =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.CLERK_SECRET_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    "";
  if (!secret) return null;
  // Derive a stable 32-byte key from whatever secret we have.
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  if (!key) return PLAIN_PREFIX + plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: enc:v1:<iv b64>:<tag b64>:<ciphertext b64>
  return (
    ENC_PREFIX +
    iv.toString("base64") +
    ":" +
    tag.toString("base64") +
    ":" +
    encrypted.toString("base64")
  );
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;

  if (stored.startsWith(PLAIN_PREFIX)) {
    return stored.slice(PLAIN_PREFIX.length);
  }

  if (!stored.startsWith(ENC_PREFIX)) {
    // Legacy / unprefixed — return as-is.
    return stored;
  }

  const key = getKey();
  if (!key) return null;

  try {
    const rest = stored.slice(ENC_PREFIX.length);
    const [ivB64, tagB64, dataB64] = rest.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

/** Random URL-safe token for OAuth state / CSRF. */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

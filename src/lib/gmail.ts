/**
 * Gmail OAuth + send — raw fetch against Google's OAuth2 + Gmail REST APIs.
 * No heavy googleapis dependency.
 *
 * Scopes:
 *   - gmail.send : send mail on the user's behalf
 *   - userinfo.email : know which address we're sending from
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export function getOAuthClientId(): string | null {
  return process.env.GOOGLE_OAUTH_CLIENT_ID || null;
}

function getOAuthClientSecret(): string | null {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET || null;
}

export function getRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

export function isGmailConfigured(): boolean {
  return Boolean(getOAuthClientId() && getOAuthClientSecret());
}

/** Build the Google consent screen URL. */
export function buildAuthUrl(state: string): string {
  const clientId = getOAuthClientId();
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline", // get a refresh token
    prompt: "consent", // force refresh token on re-auth
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const clientId = getOAuthClientId();
  const clientSecret = getOAuthClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
    scope: data.scope,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const clientId = getOAuthClientId();
  const clientSecret = getOAuthClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token refresh failed (${resp.status}): ${text.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    refresh_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // usually absent on refresh — caller keeps old one
    expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
    scope: data.scope,
  };
}

export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  const resp = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as { email?: string };
  return data.email ?? null;
}

/** Build an RFC 2822 message and base64url-encode it for the Gmail API. */
function buildRawMessage(opts: {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const fromHeader = opts.fromName
    ? `${encodeHeaderWord(opts.fromName)} <${opts.from}>`
    : opts.from;

  // Plain-text body. Encode subject for non-ASCII safety.
  const lines = [
    `From: ${fromHeader}`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeaderWord(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    opts.body,
  ];
  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf8").toString("base64url");
}

/** RFC 2047 encode a header value if it contains non-ASCII. */
function encodeHeaderWord(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export type SendResult = {
  id: string;
  threadId: string;
};

export async function sendGmailMessage(opts: {
  accessToken: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  const raw = buildRawMessage(opts);

  const resp = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gmail send failed (${resp.status}): ${text.slice(0, 300)}`);
  }

  const data = (await resp.json()) as { id: string; threadId: string };
  return { id: data.id, threadId: data.threadId };
}

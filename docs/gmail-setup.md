# Personal Gmail setup

The CRM login and Gmail sending are separate connections. Clerk verifies the owner; Google OAuth authorizes sending from the selected Gmail account.

1. Open https://console.cloud.google.com/ with nrpyles@gmail.com. Select an existing project you own or create ProspectBot.
2. Open APIs & Services, then Library. Find Gmail API and enable it.
3. Open Google Auth platform, then Branding. Select Get started if needed. Use ProspectBot as the app name and nrpyles@gmail.com for support/contact email.
4. Under Audience, use External for this personal Gmail account. While the app is in Testing, add nrpyles@gmail.com as a test user.
5. Under Data Access, declare the requested scopes: https://www.googleapis.com/auth/gmail.send, https://www.googleapis.com/auth/userinfo.email, and openid. The application sends email and identifies the sending account; it does not request inbox reading.
6. Under Clients, select Create client, then Web application. Add this exact Authorized redirect URI:

```text
https://prospect-bot-git-codex-private-crm-build-neal-pyles.vercel.app/api/auth/google/callback
```

7. Copy the generated client ID and secret directly into Vercel project environment variables. Do not send them in chat or commit them. Apply them to Preview for the current branch deployment. Set the same values in Production only if it will use this same OAuth client; register that deployment's callback separately when moving domains.

| Variable | Value |
| --- | --- |
| GOOGLE_OAUTH_CLIENT_ID | Generated Google web client ID |
| GOOGLE_OAUTH_CLIENT_SECRET | Generated Google web client secret |
| NEXT_PUBLIC_APP_URL | https://prospect-bot-git-codex-private-crm-build-neal-pyles.vercel.app |

8. Redeploy the latest codex/private-crm-build deployment. Open /app/settings, select Connect Gmail, and choose nrpyles@gmail.com. Confirm the displayed Sending as address before preparing any mail. Connecting does not send a message.

Keep the existing token encryption configuration stable. Testing mode is useful for the initial connection, but Google limits these refresh tokens to seven days. Review the personal-use production configuration after the first connection if you want to avoid weekly reconnection. Publishing OAuth consent does not change the CRM's private owner gate.

References: [Google OAuth setup](https://developers.google.com/workspace/guides/configure-oauth-consent), [Web application credentials](https://developers.google.com/workspace/guides/create-credentials), [Server OAuth and refresh tokens](https://developers.google.com/identity/protocols/oauth2/web-server), [Token expiry in testing](https://developers.google.com/identity/protocols/oauth2).

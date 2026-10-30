# Fiction Flix — n8n Auth UI

React sign-in and sign-up UI that sends authentication requests to an n8n webhook.

## Connect n8n

1. Create a Supabase project. In **Authentication → Sign In / Providers → Email**, enable email confirmations to require verified email addresses. Supabase then rejects sign-in attempts for users who have not confirmed their email.
2. In n8n, import `n8n/fictionflix-auth.json`.
3. Open the `Supabase Auth` node. Replace `YOUR_PROJECT` in both URLs with your Supabase project reference and replace `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with that project's publishable/anon key. Never use the Supabase `service_role` key here.
4. In both CORS settings in the workflow, replace `http://localhost:5173` with the exact origin hosting this app. Keep the local origin while testing locally.
5. Save and activate the workflow. Copy its **Production URL** (not the Test URL).
6. Create `.env` in this project root with:

```env
VITE_N8N_AUTH_WEBHOOK=https://YOUR-N8N-DOMAIN/webhook/fictionflix-auth
```

7. Restart the Vite dev server. The app posts URL-encoded form fields to that webhook. Configure **Allowed Origins (CORS)** on the same Webhook node to include `http://localhost:5173` so the browser can read the response.

Sign-in fields:

`action=signin`, `email=user@example.com`, `password=...`

Sign-up fields:

`action=signup`, `name=Demo User`, `email=user@example.com`, `password=...`

The workflow routes sign-up to Supabase Auth, which persistently saves users in the project's managed `auth.users` store. Sign-in asks Supabase Auth to verify the email/password; it does not create a new user. With email confirmation enabled, only users who have verified their email can sign in. A sign-up response without a session token tells the user to check email. Manage users in the Supabase dashboard under **Authentication → Users**. No separate password table is needed.

Example success response:

{
  "success": true,
  "user": {
    "id": "123",
    "name": "Demo User",
    "email": "user@example.com"
  },
  "token": "temporary-token",
  "message": "Welcome back."
}

For this POC, token/user are stored in sessionStorage.

IMPORTANT:
- Do not store plaintext passwords in n8n execution data or a database.
- Configure CORS and rate limiting before production. Use HTTPS and restrict the n8n webhook to the deployed app origin.
- This is a UI integration example, not production authentication.

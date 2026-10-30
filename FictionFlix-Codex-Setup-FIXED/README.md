# FictionFlix

FictionFlix is a React/Vite story catalogue served by the Flask application in the workspace root. Flask provides email-verified sign-up and sign-in, profile updates and profile-picture uploads, per-account preferences and reading/saved-story history, password resets, role-based dashboards and Studio access, persistent story/category data, and artwork uploads. Accounts use server-side Flask sessions (not JWT/local-storage role claims); protected APIs resolve the current role from the database on every request. New public signups receive the `user` role. The supported roles are `user`, `member`, `team`, `owner`, and `admin`; owners can provision the first admin from Studio account roles, and admins can update roles from `/dashboard/admin`. SMTP must be configured for account verification emails. Profile pictures are account-specific and support PNG, JPG, WebP, or AVIF images up to 8 MB. The profile name comes from the name entered during registration or later profile edits; email/password sign-in does not import a name from Google/Gmail. SQLite is the default database; the Render deployment blueprint attaches a persistent disk for the database and uploaded files.

## Run locally on Windows

From the workspace root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Set-Location .\FictionFlix-Codex-Setup-FIXED
npm ci
npm run build
Set-Location ..
.\.venv\Scripts\python.exe .\app.py
```

Open <http://127.0.0.1:5000>. Rebuild the frontend after changing its source. For frontend-only development, run `npm run dev` in this folder; the integrated site and authenticated APIs are served by Flask.

## Production

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Render setup, owner account, persistent storage, and optional email configuration. A public deployment requires access to a Render account; the repository includes a deployment blueprint but cannot create or publish an account on the user's behalf.

## Story media

The catalogue, reading experience, Studio, YouTube embeds, and local audio/video presentation are included. Real audio/video playback requires the rights-cleared media sources to be uploaded or linked in Studio. YouTube embeds retain YouTube's own player controls and branding.

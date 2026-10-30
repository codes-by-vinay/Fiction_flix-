# FictionFlix project status

Updated: 2026-10-20

## Working locally

- React/Vite catalogue is served by Flask from the same origin.
- Flask provides signup, login, logout, profile edits, current-user lookup, and signed password-reset links.
- SQLite persists accounts, Studio roles, shows, and categories. MongoDB remains an optional user store through `MONGO_URI`.
- Owner/team role checks protect the Studio API. The owner can grant or revoke team access in Studio.
- Studio changes replace persisted server-side content; published shows/categories are exposed publicly.
- Poster and hero uploads are restricted to PNG, JPG, WebP, or AVIF and 8 MB.
- The Render blueprint builds and serves the frontend and Flask API together with a persistent disk.
- Flask API tests and a production Vite build are included.

## Setup required before public launch

- Create/authorize a Render service from the root `render.yaml`.
- Configure `OWNER_EMAIL` in Render before creating the first owner account.
- Configure SMTP credentials if email password reset should be enabled.
- Verify the hosted URL, persistent disk, owner sign-in, Studio publishing, and uploaded artwork after deployment.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the launch steps. No hosting account or public URL is available from this workspace yet.

## Media limits

Book text and YouTube sources are supported. Audio and vertical-video presentations use the included experience artwork until rights-cleared audio/video sources are supplied. YouTube playback is provided by YouTube's embedded player.

# FictionFlix Node Auth

A standalone email/password login system using Node.js, Express, MongoDB, bcrypt, and JWT. It does not replace or modify the existing Vite/Supabase FictionFlix app.

## 1. Project structure

```text
node-auth/
├── .env.example
├── .gitignore
├── compose.yaml
├── package.json
├── server.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── app.js
│   ├── config.js
│   ├── database.js
│   ├── middleware/
│   │   └── requireAuth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   └── validation.js
└── test/
    └── validation.test.js
```

## 2. Requirements

- Node.js 20 or newer.
- MongoDB running locally, or Docker Desktop for the included Compose service.

## 3. Install and start

From this folder, install dependencies:

```powershell
npm install
```

If MongoDB is already installed and running, the app uses `mongodb://127.0.0.1:27017/fictionflix_auth` by default. Otherwise, start the included MongoDB container in a second terminal:

```powershell
docker compose up -d mongo
```

The app reads `MONGODB_URI` from this folder's `.env` first, then falls back to `MONGO_URI` in the repository-root `.env`. Reserved characters in MongoDB usernames and passwords, such as `@`, are URI-encoded automatically.

Then start the app:

```powershell
npm start
```

Open <http://localhost:3000>. For automatic restarts while developing, use `npm run dev`.

Optional environment overrides can be made by copying `.env.example` to `.env`. `MONGODB_URI` and `PORT` have working local defaults. In production, set `NODE_ENV=production` and a unique random `JWT_SECRET` of at least 32 bytes; the app refuses to start in production without it. Never commit `.env`.

## 4. Authentication API

- `POST /api/auth/signup` accepts `{ "email": "reader@example.com", "password": "story-pass-1" }`, stores a bcrypt hash, and starts a session.
- `POST /api/auth/login` accepts the same fields and verifies the bcrypt hash.
- `GET /api/auth/me` returns the signed-in user's public profile; it returns `401` without a valid session.
- `POST /api/auth/logout` clears the session cookie.

The JWT is stored in an `HttpOnly`, `SameSite=Strict` cookie, not in browser storage or a JSON response. It expires after eight hours. Cookies use the `Secure` flag in production. Authentication endpoints are rate-limited.

## 5. Tests

```powershell
npm test
```

The user schema hashes passwords with bcrypt before MongoDB writes. The API never returns the password hash. This is a ready-to-run starter; before a public deployment, also configure HTTPS, backups, monitoring, and your production MongoDB network/access rules.
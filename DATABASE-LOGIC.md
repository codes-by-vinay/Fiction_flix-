# FictionFlix: Backend aur Database Logic

Yeh guide batati hai ki FictionFlix ka main app kis backend par chalta hai, MongoDB/SQLite ka use kaise hota hai, aur `signin/node-auth` wala Node.js project usse kaise alag hai.

## Seedha jawab

- **Main FictionFlix website:** React/Vite frontend + Python Flask backend (`app.py`).
- **Main app ka MongoDB driver:** PyMongo.
- **Main app MongoDB environment variable:** `MONGO_URI`.
- **Main app fallback database:** SQLite.
- **Standalone login starter:** `signin/node-auth` mein Node.js + Express + Mongoose + MongoDB. Yeh main website se connected nahi hai.
- **Node starter ka MongoDB environment variable:** `MONGODB_URI`. Yeh Flask ke `MONGO_URI` ka substitute nahi hai.

## Main website ka request flow

```text
User ka browser
  -> React/Vite frontend
  -> Flask API (app.py)
  -> MONGO_URI set hai? MongoDB use hoga : SQLite use hoga
```

Render par Dockerfile Flask app ko Gunicorn se start karta hai. Frontend build bhi Docker image mein copy hota hai, lekin `signin/node-auth` wala Node server start nahi hota.

## Flask MongoDB ya SQLite kaise chunta hai?

`app.py` environment se `MONGO_URI` padhta hai:

- `MONGO_URI` set ho to PyMongo connection banata hai, `fictionflix_db` database chunta hai aur `users` collection use karta hai.
- `MONGO_URI` set na ho to app user data ke liye `DATABASE_PATH` par SQLite use karta hai.

Current `render.yaml` mein `DATABASE_PATH=/var/data/fictionflix.sqlite3` hai aur `MONGO_URI` configured nahi hai. Is config ke saath deployed main app **SQLite mode mein hai**, MongoDB mode mein nahi.

MongoDB mein database/collection tab dikhte hain jab app us database mein pehli baar data likhe. Sirf cluster banana ya URI add karna purane SQLite records ko MongoDB mein copy nahi karta.

## Main app ka data kahan store hota hai?

| Data | Current Flask code ka storage |
|---|---|
| User account, password hash, role, email verification | `MONGO_URI` ho to MongoDB `fictionflix_db.users`; warna SQLite |
| Shows aur categories | SQLite `content` table |
| User ki saved stories aur reading progress | SQLite `user_library` table |
| Uploaded artwork | `UPLOAD_FOLDER` mein files |
| Email verification/password-reset messages | Configured SMTP email service |

**Dhyan rahe:** Flask mein MongoDB enable karne par users MongoDB mein jaate hain, lekin shows/categories aur user library ka code SQLite hi use karta hai. Isliye main app ka storage mixed ho sakta hai.

Render config SQLite aur uploads ke liye persistent disk `/var/data` par mount karti hai. Disk/config hataane ya badalne se pehle data persistence ka asar check karein.

## Main Flask app ka signup flow

1. Browser `POST /api/auth/signup` par name, email aur password bhejta hai.
2. Flask name/email/password validate karta hai.
3. Password ko hash karke `password_hash` field mein store karta hai; raw password store nahi hota.
4. User ko MongoDB `users` collection ya SQLite `users` table mein banata hai.
5. Naya account `email_verified: false` hota hai.
6. Flask verification link email karne ki koshish karta hai. Link kholne par account verified hota hai.
7. Configured owner email ke liye pehla owner account banane mein `OWNER_SETUP_TOKEN` bhi chahiye. Baaki public accounts default `user` role se bante hain.

## Main Flask app ka login aur session flow

1. Browser `POST /api/auth/login` par email/password bhejta hai.
2. Flask selected database mein email se user dhoondhta hai.
3. Submitted password ko saved hash se compare karta hai.
4. Galat password ya unverified email par login reject hota hai.
5. Successful login par Flask server-side signed session cookie set karta hai.
6. Authenticated requests cookie ke saath Flask API tak jaati hain. Role-protected requests mein Flask role ko database se dobara check karta hai.
7. Logout par Flask session clear hota hai.

Frontend `/api/...` endpoints ko same-origin par call karta hai; yeh API client `FictionFlix-Codex-Setup-FIXED/src/apiClient.js` mein hai.

## Main app ke kuch relevant API flows

- Signup: `POST /api/auth/signup`
- Email verification: `GET` ya `POST /api/auth/verify-email`
- Verification email resend: `POST /api/auth/verify-email/resend`
- Login/logout: `POST /api/auth/login`, `POST /api/auth/logout`
- Current user: `GET /api/auth/me`
- Profile/preferences: `/update_profile`, `/api/user/preferences`
- User library: `/api/user/library`
- Public content: `GET /api/content/public`
- Studio content save: `PUT /api/content/managed/<collection>`
- Artwork upload: `POST /api/studio/uploads`
- Studio roles: `/api/studio/roles`, `/api/admin/update-role`

Shows/categories save karne wala managed-content endpoint SQLite `content` table ko replace karta hai. User-library endpoint bhi SQLite `user_library` table padhta/likhta hai.

## Alag Node.js login starter

`signin/node-auth` ek alag standalone project hai:

```text
Node.js + Express
  -> Mongoose
  -> MONGODB_URI
  -> MongoDB
```

Is project mein:

- `.env.example` mein `MONGODB_URI` ka local default `mongodb://127.0.0.1:27017/fictionflix_auth` hai.
- `src/config.js` isi `MONGODB_URI` ko padhta hai.
- `src/database.js` Mongoose se MongoDB connect karta hai.
- `src/models/User.js` email aur password wala user schema define karta hai. Password bcrypt se hash hota hai.
- `src/routes/auth.js` signup/login/me/logout endpoints define karta hai.
- Login par JWT ban kar HttpOnly cookie mein rakha jata hai.
- `server.js` MongoDB connection successful hone ke baad Express server start karta hai.

Node starter ki Mongo database `fictionflix_auth` hai. Flask app ki Mongo database `fictionflix_db` hai. Dono ke URI variable, database, auth/session implementation aur server alag hain. Node starter ka `.env` Flask app ko MongoDB par switch nahi karega, aur Flask users Node starter mein automatically nahi aayenge.

## MongoDB Atlas par main Flask app chalani ho to

1. Atlas mein cluster, database user aur network access configure karein.
2. Render mein Flask service ke environment variables mein **`MONGO_URI`** set karein. URI private rakhein; password chat/source code mein share ya commit na karein.
3. Service redeploy karke logs/health check dekhein.
4. Signup test ke baad Atlas mein `fictionflix_db` aur `users` collection check karein.
5. Yaad rakhein: isse Flask users MongoDB par jayenge, par shows/categories aur user library SQLite mein hi rahenge jab tak unka code alag se badla/migrate na ho.

MongoDB Atlas ki network rules ko public access ke liye bina zarurat khula na rakhein. Production mein least-privilege database user, private credentials, backups aur network restrictions use karein.

## Code references

- Main Flask app aur DB selection: `app.py`
- Render service, SQLite path aur persistent disk: `render.yaml`
- Flask Docker/Gunicorn deployment: `Dockerfile`
- Python dependencies, jisme PyMongo hai: `requirements.txt`
- Frontend API client: `FictionFlix-Codex-Setup-FIXED/src/apiClient.js`
- Node app variables: `signin/node-auth/.env.example`
- Node app configuration: `signin/node-auth/src/config.js`
- Node MongoDB connection: `signin/node-auth/src/database.js`
- Node user schema: `signin/node-auth/src/models/User.js`
- Node auth endpoints: `signin/node-auth/src/routes/auth.js`
- Node app setup guide: `signin/node-auth/README.md`

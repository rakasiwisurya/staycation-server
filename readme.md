# Staycation — Server

Express + Mongoose backend. Serves a JSON API for the React client
(`/api/v1/member`) and an EJS admin dashboard (`/admin`).

The codebase is **environment-driven**: the exact same code runs locally and in
production. Only environment variables change between the `main` (local) and
`production` (cloud) branches.

## Stack

- Node.js ≥ 18, Express 4
- MongoDB via Mongoose 8 (local MongoDB 8 **or** MongoDB Atlas)
- Image storage: local disk **or** Cloudinary (selected by `STORAGE_DRIVER`)
- EJS admin dashboard (SB Admin 2 theme)

## Getting started (local)

```bash
npm install
cp .env.example .env      # then edit values
npm run seed              # wipe + populate demo data
npm run dev               # nodemon, http://localhost:4000
```

- Admin dashboard: http://localhost:4000/admin/signin (seeded login: `admin` / `admin123`)
- API base: http://localhost:4000/api/v1/member

## Environment variables

See [.env.example](.env.example) for the full, documented list. The important
switches:

| Variable         | Local                                     | Production                   |
| ---------------- | ----------------------------------------- | ---------------------------- |
| `MONGODB_URI`    | `mongodb://localhost:27017/db_staycation` | Atlas `mongodb+srv://…`      |
| `STORAGE_DRIVER` | `local`                                   | `cloudinary`                 |
| `SERVER_URL`     | `http://localhost:4000`                   | `https://<app>.onrender.com` |
| `CLIENT_URL`     | `http://localhost:5173`                   | `https://<site>.netlify.app` |
| `CLOUDINARY_*`   | _(unused)_                                | your Cloudinary credentials  |

## Image storage

Image references are stored in MongoDB as `imageUrl`:

- **local** driver → relative paths (`images/<file>`) served from `public/images`.
- **cloudinary** driver → absolute secure URLs.

Both the API responses and the EJS templates resolve these through one helper
(`helpers/storage.js`), so the client never needs to know which driver is
active. Demo image files are not committed (they're git-ignored); upload images
through the admin panel, or drop files into `public/images` to match the seeded
paths.

## Scripts

| Script        | Description                                    |
| ------------- | ---------------------------------------------- |
| `npm run dev` | Start with nodemon (auto-reload)               |
| `npm start`   | Start for production                           |
| `npm run seed`| Wipe and repopulate all collections            |
| `npm test`    | Run the mocha/chai test suite                  |

## Deployment (Render — production branch)

[render.yaml](render.yaml) is a Render Blueprint. Set the secret values
(`MONGODB_URI`, `SERVER_URL`, `CLIENT_URL`, `CLOUDINARY_*`) in the Render
dashboard. Seed Atlas once with `npm run seed` (using a production `.env`) if you
want demo data.

## Project layout

```
config/        env, database connection, cloudinary setup
controllers/   adminController (dashboard), apiController (client API)
middlewares/   auth (admin session guard), upload (env-switched multer)
helpers/       storage (build / resolve / remove image URLs)
models/        Mongoose schemas
routes/        index, users, admin, api
views/         EJS admin dashboard
seed.js        demo data seeder (npm run seed)
```

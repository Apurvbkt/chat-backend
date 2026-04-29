# Realtime Chat Backend (Production Ready)

Node.js + Express + MongoDB + Socket.IO backend for one-to-one realtime chat.

## Tech Stack

- Node.js (ES Modules)
- Express.js
- MongoDB (Mongoose)
- Socket.IO
- JWT Authentication
- bcrypt password hashing
- express-validator
- Helmet + CORS + Morgan
- express-rate-limit

## Project Structure

```text
backend/
  server.js
  src/
    app.js
    server.js
    config/
      cors.js
      db.js
    controllers/
    middleware/
    models/
    routes/
    sockets/
    utils/
    validators/
```

## Environment Variables

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Required values:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<your_mongodb_atlas_uri>
JWT_SECRET=<your_long_secure_secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
```

For multiple frontend domains:

```env
CLIENT_URL=https://app-one.com,https://app-two.com
```

## Local Run

```powershell
npm install
npm run dev
```

Health endpoint:

`GET /api/health` -> `{ "status": "ok", "message": "Server running" }`

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

Password hashing is done with `bcryptjs`, and auth uses Bearer JWT.

## Socket.IO Events

Client to server:

- `chat:join`
- `message:send`
- `message:delivered`
- `message:seen`
- `typing:start`
- `typing:stop`

Server to client:

- `message:new`
- `message:status`
- `typing:update`
- `presence:update`
- `chat:new`

## MongoDB Atlas Setup

1. Create Atlas project + cluster.
2. Create DB user and password.
3. Network Access:
   - Add Render outbound IPs, or use `0.0.0.0/0` during setup.
4. Get connection string and put it in `MONGO_URI`.

Example format:

`mongodb+srv://<username>:<password>@<cluster>.mongodb.net/realtime_chat?retryWrites=true&w=majority`

## Render Deployment

1. Push this backend to GitHub.
2. In Render, create **Web Service** from that repo.
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render dashboard:
   - `NODE_ENV=production`
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=https://your-frontend-url`
5. Deploy and verify:
   - `https://<your-service>.onrender.com/api/health`

## Production Notes

- Uses `http.createServer(app)` and `server.listen(...)` for Socket.IO compatibility.
- CORS and Socket.IO CORS are both environment-driven.
- Includes global error middleware and route validation.
- Includes basic request throttling with rate limits.


# Secure.Net

Secure.Net is a Smart India Hackathon-style investigation management prototype with a browser UI and a small Node.js backend.

## Included

- `secure-net.html` — Secure.Net frontend and UI
- `server.js` — Node.js backend/API
- `data/db.json` — mock backend database
- `package.json` — project configuration

## Demo login

- ID: `admin`
- Password: `admin`

Select either available role in the UI. This is demo authentication, not production security.

## Run locally

Requirements: Node.js 18+

```bash
npm start
```

Open `http://localhost:3000`.

## Backend endpoints

- `GET /api/health`
- `POST /api/login`
- `GET /api/state`
- `PUT /api/state`
- `POST /api/audit`
- `POST /api/logout`

The UI uses the backend API after login. The mock database is stored in `data/db.json`.

## Important

This is a prototype. File upload, cryptographic verification, AI assistance, leak tracing, court certificates, and authentication are simulated/demo workflows. Do not use the mock credentials or JSON database for real police, legal, or evidentiary data.

# Udaan API

## Local setup

1. Copy `.env.example` to `.env` in this `backend` directory and set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Set `APPS_SCRIPT_URL` to the existing Google Apps Script web app URL to enable password recovery and admin email verification. Keep these values in the backend environment only.
2. From `backend`, run `npm install`.
3. Start MongoDB, then run `npm run dev`.
4. On first API startup, the API creates Batch-A (13:00–14:00) and Batch-B (06:00–07:00) and records that initialization so deleted batches do not reappear after a restart.
5. In another terminal, run `npm run admin:create` from `backend` once to create the initial admin account.
6. Copy `frontend/.env.example` to `frontend/.env.local`, then run `npm install` and `npm run dev` from `frontend`.

Use only `backend/.env` for the API secrets. The server loads dotenv from its working directory; a `backend/src/.env` file is not loaded.

## Batch and attendance API

All batch, student, and attendance routes require an admin session cookie from `POST /api/auth/login`.

- `GET /api/batches?includeInactive=true` lists schedules and assigned students.
- `POST /api/batches` creates a batch with `{ "name", "startTime", "endTime", "studentIds" }`. Times use 24-hour `HH:mm`.
- `PATCH /api/batches/:id` updates schedule or the complete assigned student ID list.
- `PATCH /api/batches/:id/active` changes active status.
- `DELETE /api/batches/:id` deletes only a batch with no assigned students or attendance history.
- `GET /api/students` lists student identities and current batch assignments.
- `POST /api/students` creates a student with `{ "name", "phone", "fatherName" }`.
- `GET /api/attendance/:batchId?date=YYYY-MM-DD` loads current attendance or a saved historical record.
- `POST /api/attendance` saves `{ "batchId", "date", "records": [{ "studentId", "status" }] }`.

Student identity uniqueness is the normalized combination of name, phone, and father's name. Batch assignment and attendance ownership are validated on the server.

## Admin password recovery

- `POST /api/auth/password-reset/request` and `POST /api/auth/password-reset/resend` accept `{ "email" }`. Both return the same generic response for unknown and known admin email addresses.
- `POST /api/auth/password-reset/verify` accepts `{ "email", "otp" }` and returns a short-lived, one-time `resetToken` only after the server validates the emailed OTP.
- `POST /api/auth/password-reset/complete` accepts `{ "resetToken", "password" }`. A successful reset hashes the password and increments the session version to invalidate existing admin sessions.
- OTP values are six digits, expire after 10 minutes, have five verification attempts, and can be resent after 60 seconds. Reset authorization expires after 10 minutes and is consumed once.
- `APPS_SCRIPT_URL` must point to the configured Google Apps Script web app, which accepts `{ to, subject, html }` and returns `{ "success": true }` after delivery. Delivery failures are not logged with recipient or OTP details. `PASSWORD_RESET_SECRET` is optional; if omitted, the API uses `JWT_SECRET` to protect stored OTP, verification-code and reset-token hashes.
- `GET /api/auth/admin/profile` and `PATCH /api/auth/admin/profile` require an admin session. Profile edits support name, phone, a small compressed image data URL, and an email change that leaves the old email active until the new address is verified.
- `POST /api/auth/admin/profile/email/verify` accepts `{ "otp" }`; `/resend` sends a fresh code subject to the cooldown. Verification codes expire after 10 minutes and permit five attempts.

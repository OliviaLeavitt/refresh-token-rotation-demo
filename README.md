# Refresh Token Rotation Demo

A small Express API demonstrating short-lived JWT access tokens, rotating refresh
tokens, and rejection of previously used refresh tokens.

## Run locally

```sh
npm ci
npm start
```

The API listens on `http://localhost:3000`. Use the intentionally fictional demo
account: username `alice`, password `password`.

## Try the flow

1. `POST /login` with JSON `{"username":"alice","password":"password"}`.
   Save the returned access and refresh tokens.
2. `GET /profile` with `Authorization: Bearer <accessToken>`.
3. `POST /refresh` with JSON `{"refreshToken":"<refreshToken>"}`.
   Save the replacement tokens.
4. Repeat step 3 with the old refresh token: the request returns HTTP 401.
5. `POST /logout` with the current access token to invalidate stored refresh state.

## What this demonstrates

- Access tokens expire after one minute; refresh tokens expire after seven days.
- Each user has one current refresh-token identifier in an in-memory map.
- Rotation replaces that identifier, so the previous token can no longer refresh.
- Logging out removes the user's current refresh-token record.

## Demo boundaries

This is an educational example, with a hardcoded signing key and fictional
credentials. State disappears when the process restarts. It is not a production
authentication service: it lacks persistent sessions, token-family revocation,
cryptographically random refresh identifiers, and distinct access/refresh-token
validation. Logout invalidates refresh state; an issued access token lasts until expiry.

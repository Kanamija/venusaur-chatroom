# Authentication API Contract

This document explains how the React frontend communicates with the Express server to create accounts, log in, and log out.

**Server:** `http://localhost:3000`

## 1. API Endpoints

| Method | Endpoint            | Purpose                |
| ------ | ------------------- | ---------------------- |
| POST   | `/api/users/signup` | Create an account      |
| POST   | `/api/users/login`  | Log in                 |
| GET    | `/api/users/me`     | Check who is logged in |
| POST   | `/api/users/logout` | Log out                |

## 2. Request and Response Formats

All request bodies and responses use JSON.

### Sending User Credentials

Signup and login require the same request body:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Successful Response

Signup, login, and `/me` return:

```json
{
  "success": true,
  "user": {
    "id": "1",
    "username": "testuser",
    "createdAt": "2026-10-12T18:30:00.000Z"
  }
}
```

The `user` object contains:

| Property    | Type   | Description           |
| ----------- | ------ | --------------------- |
| `id`        | string | Unique user ID        |
| `username`  | string | Username              |
| `createdAt` | string | Account creation date |

Passwords are never returned.

Logout returns:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Error Response

All errors include `success: false` and a message explaining the problem.

Example:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

The HTTP status code indicates whether the request succeeded or failed.

## 3. Authentication Endpoints

### Signup — `POST /api/users/signup`

Creates a new account.

**Request:** Send the username and password shown above.

- Username cannot be empty and is trimmed.
- Usernames must be unique.
- Signup does not automatically log the user in.

**Success:**

- `201 Created` — Account created. Returns the user.

**Errors:**

- `400 Bad Request` — Invalid username or password.
- `409 Conflict` — Username already exists.
- `500 Internal Server Error` — Unexpected server error.

### Login — `POST /api/users/login`

Checks the username and password and creates a login session. Failed login attempts are rate-limited by IP address. Successful logins do not count toward the limit.

**Request:** Send the username and password shown above.

**Success:**

- `200 OK` — Login successful. Returns the user.

**Errors:**

- `400 Bad Request` — Missing or invalid credentials.
- `401 Unauthorized` — Username or password is incorrect.
- `429 Too Many Requests` — Too many failed login attempts.
- `500 Internal Server Error` — Unexpected server error.

### Current User — `GET /api/users/me`

Checks whether the user is currently logged in.

**Request:** No body required. The server uses the session cookie to identify the user.

**Success:**

- `200 OK` — Returns the currently logged-in user.

**Errors:**

- `401 Unauthorized` — Missing, invalid, or expired session.
- `500 Internal Server Error` — Unexpected server error.

**Frontend use:** Call this endpoint when the React app loads to check whether the user is already logged in.

### Logout — `POST /api/users/logout`

Ends the current login session.

**Request:** No body required. The server uses the session cookie to identify the user.

**Success:**

- `200 OK` — Session deleted and login cookie cleared.

**Errors:**

- `500 Internal Server Error` — Unexpected server error.

Logout also succeeds if the user is already logged out.

## 4. Frontend Integration

Use JavaScript's `fetch()` to communicate with the Express server.

### Example: Login

```ts
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password }),
});

const data = await response.json();

if (response.ok) {
  // Login succeeded. Save data.user in React state.
} else {
  // Login failed. Display data.message.
}
```

### Understanding the Example

**`JSON.stringify()`** converts the JavaScript object containing the username and password into JSON.

**`response.json()`** reads the server's JSON response and converts it into a JavaScript value.

**`response.ok`** indicates whether the request succeeded:

- `true` — HTTP status 200–299.
- `false` — An error status, such as 400 or 401.

**`credentials: 'include'`** tells the browser to send and accept cookies.

Use it for login, `/me`, and logout.

### What React Should Do

| Action            | Frontend behavior                           |
| ----------------- | ------------------------------------------- |
| Signup succeeds   | Show the login form                         |
| Login succeeds    | Save `data.user` in React state             |
| Login fails       | Display `data.message`                      |
| App loads         | Call `/me` to check for an existing session |
| `/me` returns 401 | Treat the user as logged out                |
| Logout succeeds   | Clear the user from React state             |

For unexpected server errors, display an error rather than automatically logging the user out.

## 5. How Sessions Work

The application uses a database to remember logged-in users.

1. Login creates a session in the database.
2. The browser receives a cookie named `sessionId`.
3. The browser automatically sends that cookie with future requests.
4. Express checks the session to identify the user.

**Important details:**

- The frontend does not need to read or store the session ID.
- The cookie is HTTP-only, meaning JavaScript cannot read it.
- Sessions expire after 24 hours.
- Expired sessions are removed from the database whenever someone logs in.
- Logging out ends the current session, not sessions on other devices.

**Note:** The `fetch()` example assumes Vite is configured to forward `/api` requests to Express.

**Development:** Cookies work over HTTP (localhost), so HTTPS is not required.

**Production:** Set `NODE_ENV=production` and use HTTPS. This tells the browser to send session cookies only over secure HTTPS connections.

---

This contract covers authentication only. Chatroom endpoints and Socket.IO events are handled separately.

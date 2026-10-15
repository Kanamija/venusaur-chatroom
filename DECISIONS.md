# Venusaur Chatroom Decisions

This document records the team's technical decisions and the reasoning behind them, plus decisions still open. Scope and goals live in `PROJECT_BRIEF.md`.

When a decision is made, move it from **Open Questions** into **Decided** with its reasoning.

## Decided

### Tech Stack

**Decision:** React + Vite, Express, Socket.io, MongoDB, PostgreSQL (Supabase), and bcrypt.

**Reason:** The team chose these technologies to practice them during the project. MongoDB is the primary database, while PostgreSQL remains available as an optional authentication alternative.

### TypeScript

**Decision:** The project is written in TypeScript, on both the frontend and the backend.

**Reason:** The team wants type checking and practice with TypeScript.

### Area Ownership

**Decision:** Eddie owns authentication, including MongoDB and PostgreSQL implementations. Kanami owns MongoDB chat data, Express routes and middleware, and Socket.io. Tanisha owns the frontend.

**Reason:** Each person goes deep on one technology.
_Updated October 12, 2026: Tanisha took over the frontend and Kanami took over Express and Socket.io._

### Public Repository with a Protected `main`

**Decision:** The repository is public. `main` requires a pull request with one approval, blocks force pushes and deletion, and has no bypass, including for the owner.

**Reason:** Branch rulesets are free on public repositories. Required reviews make everyone practice the PR workflow.

**Consequence:** Never commit secrets. See `CONTRIBUTING.md`.

### Authentication Built from Scratch

**Decision:** The team builds its own sign-up and login with bcrypt for password hashing, instead of using Supabase Auth.

**Reason:** Building auth by hand is part of the practice.

**Consequence:** The team is responsible for hashing passwords, verifying credentials, and managing login sessions. Authentication supports MongoDB and PostgreSQL through a shared database-independent interface.

### Database-Backed Sessions

**Decision:** Authentication uses database-backed sessions with HTTP-only cookies. MongoDB is the primary authentication database, with PostgreSQL supported as an alternative.

**Reason:** Server-side sessions allow the application to verify logged-in users and invalidate sessions during logout without introducing JWT authentication. Supporting both databases provides practice implementing authentication with PostgreSQL and MongoDB.

**Consequence:** Sessions expire after 24 hours. The server verifies session cookies for protected Express routes and Socket.IO connections, deletes sessions during logout, and removes expired sessions during login.

### Database Architecture

**Decision:** MongoDB is the primary database for users, sessions, rooms, and chat history. PostgreSQL (Supabase) remains supported as an optional authentication database, selected through `AUTH_DB`.

**Reason:** The team initially divided users and chat data between PostgreSQL and MongoDB to practice both technologies. MongoDB was later selected as the primary database to simplify deployment while retaining the PostgreSQL authentication implementation.

**Consequence:** When `AUTH_DB=mongodb`, all application data is stored in MongoDB. When `AUTH_DB=postgres`, users and sessions are stored in PostgreSQL, while rooms and chat history remain in MongoDB. Both implementations return user IDs as strings so the chat functionality works with either database.

_Updated October 7, 2026: Rooms moved from Supabase to MongoDB, agreed by Eddie and Kanami._

_Updated October 10, 2026: User IDs are represented as strings across authentication and chat._

_Updated October 14, 2026: MongoDB authentication completed and selected as the primary configuration. PostgreSQL remains available as an alternative._

### Fixed Rooms for MVP

**Decision:** The MVP has three fixed rooms. Users cannot create, rename, or delete rooms.

**Reason:** Fixed rooms keep the MVP small and avoid room-management features.

**Consequence:** The three rooms are created once by a seed script instead of through the app. The rooms are Venusaur, Charizard, and Pikachu.

### Repository Layout

**Decision:** One repository with two separate apps: `client/` (React + Vite) and `server/` (Express). Each has its own `package.json`. A root `package.json` uses `concurrently` so `npm run dev` starts both.

**Reason:** The browser and Node need different dependencies and TypeScript settings, so keeping them separate keeps each side's setup clear. One start command makes local development easier for the whole team.

**Consequence:** Dependencies are installed in three places: the root, `client/`, and `server/`. npm workspaces could reduce this to one install later if the team wants.

### ES Modules on the Server

**Decision:** The server uses ES Modules (`import`/`export`), with `"type": "module"` in `server/package.json` and `"module": "nodenext"` in `server/tsconfig.json`.

**Reason:** The client already uses ES Modules, so both sides of the codebase use the same syntax, and ESM is the modern standard for Node.

**Consequence:** Server code uses `import`, not `require`.

### Message History over REST

**Decision:** A room's recent messages are loaded with `GET /api/rooms/:id/messages`, where `:id` is the room's name (for example `Venusaur`). The response is `{ "success": true, "messages": [...] }` with the newest 50 messages, ordered oldest first. A room with no messages returns an empty `messages` list, not an error.

**Reason:** History is loaded once when a room opens, which fits a normal request better than a socket event. The `/api` prefix and the `success` field follow the existing `/api/users` routes, so the frontend can handle every response the same way.

**Consequence:** The chat page calls this route when a room opens, then receives new messages over Socket.io. Message fields are `roomId`, `userId`, `username`, `text`, and `createdAt`.

_Added October 10, 2026 by Kanami. To be confirmed by Tanisha._

### Rooms Are Identified by Name

**Decision:** A message's `roomId` holds the room's name as text: `Venusaur`, `Charizard`, or `Pikachu`. It is not a database ID.

**Reason:** There are only three fixed rooms, and a name is readable in the database, in URLs, and in socket events without an extra lookup.

**Consequence:** Spelling and capitalization must match exactly everywhere a room is named: the frontend, the Socket.io events, and the history route. A misspelled name is rejected: the history route returns a 404, and the socket sends an `error` event.

_Added October 10, 2026 by Kanami._

### Socket.io Event Shapes

**Decision:** The chat uses four custom Socket.io events.

Sent by the browser:

- `join_room`: the room's name as plain text, for example `'Venusaur'`. Joining a room leaves any room the socket was in before.
- `send_message`: `{ roomId, text }`. `roomId` is a room name. `text` is trimmed and must be 1 to 1000 characters.

Sent by the server:

- `receive_message`: the saved message, with `roomId`, `userId`, `username`, `text`, and `createdAt`. It goes to everyone in the room, including the sender.
- `error`: `{ message }`. It goes only to the browser that sent a bad event, such as an unknown room or an empty message.

**Reason:** The fields match the `Message` model and the history route, so the frontend uses one message type for both old and new messages. Validating on the server means a bad payload is rejected before it is saved or broadcast.

**Consequence:** The client does not add its own message to the screen when sending. It waits for `receive_message`, which confirms the message was saved. Socket.IO connections are authenticated using the user's database session, and the server retrieves the user ID and username from the authenticated session.

_Added October 13, 2026 by Kanami. Matches the client in Tanisha's `feat/reusable-components`._

### Socket.IO Authentication

**Decision:** Socket.IO connections are authenticated using the same database-backed sessions as Express routes.

**Reason:** Reusing existing sessions provides consistent authentication across HTTP requests and real-time connections without introducing a separate authentication mechanism.

**Consequence:** Socket.IO middleware validates the session cookie before allowing a connection. The authenticated user ID and username are stored in `socket.data` for use by chat event handlers. Connections without a valid session are rejected.

_Implemented October 14, 2026._

### Loading Environment Variables

**Decision:** The `.env` file lives in `server/`. The server loads it with `import 'dotenv/config'` as the first line of `server/src/index.ts`. Standalone scripts, such as the room seed script, start with the same import.

**Reason:** All database credentials (`MONGODB_URI`, `POSTGRES_URI`) are used only by the server, so the file sits next to the code that reads it.

**Consequence:** Server commands must run with `server/` as the working directory, which `npm run <script> --prefix server` and the root `npm run dev` already do. The `dev` and `start` scripts in `server/package.json` also still pass Node's `--env-file-if-exists=.env` flag, which is now redundant.

_Moved from Open Questions on October 10, 2026._

### MongoDB Atlas Network Access

**Decision:** The Atlas cluster accepts connections from any IP address (`0.0.0.0/0`). The password in `MONGODB_URI` is the only protection. _To be confirmed by Eddie and Tanisha._

**Reason:** Home and mobile IP addresses change often, and each change blocked the connection until the new address was added by hand. This is a short practice project with no real user data.

**Consequence:** `MONGODB_URI` must never be committed or posted publicly; share it by direct message. The rule should be removed, or the cluster paused, when the project ends.

_Added October 10, 2026 by Kanami._

## Open Questions

### Hosting

Where will the app run for the demo?

### Merge Method

Merge commit, squash, or rebase? All three are currently allowed, and GitHub defaults to a merge commit.

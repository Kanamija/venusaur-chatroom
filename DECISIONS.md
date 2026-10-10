# Venusaur Chatroom Decisions

This document records the team's technical decisions and the reasoning behind them, plus decisions still open. Scope and goals live in `PROJECT_BRIEF.md`.

When a decision is made, move it from **Open Questions** into **Decided** with its reasoning.

## Decided

### Tech Stack

**Decision:** React + Vite, Express, Socket.io, MongoDB, Supabase, and bcrypt.

**Reason:** The team chose these technologies to practice them during the project.

### TypeScript

**Decision:** The project is written in TypeScript, on both the frontend and the backend.

**Reason:** The team wants type checking and practice with TypeScript.

### Area Ownership

**Decision:** Eddie owns Supabase and authentication, Kanami owns MongoDB, and Tanisha owns Express and Socket.io. Frontend components go to whoever finishes first.

**Reason:** Each person goes deep on one technology, and shared frontend work keeps everyone busy.

### Public Repository with a Protected `main`

**Decision:** The repository is public. `main` requires a pull request with one approval, blocks force pushes and deletion, and has no bypass, including for the owner.

**Reason:** Branch rulesets are free on public repositories. Required reviews make everyone practice the PR workflow.

**Consequence:** Never commit secrets. See `CONTRIBUTING.md`.

### Authentication Built from Scratch

**Decision:** The team builds its own sign-up and login with bcrypt for password hashing, instead of using Supabase Auth. _To be confirmed by Eddie._

**Reason:** Building auth by hand is part of the practice.

**Consequence:** The team is responsible for hashing, verifying passwords, and keeping users logged in. How sessions or tokens work is still open.

### Data Split Between Supabase and MongoDB

**Decision:** Supabase (Postgres) stores users. MongoDB stores rooms and chat history.

**Reason:** Each owner gets a distinct data area to work in. Every message belongs to a room, so keeping rooms next to messages keeps the MongoDB side self-contained, and it leaves Supabase focused on users and authentication.

**Consequence:** Messages in MongoDB refer to users that live in Supabase, so both sides must agree on the user ID format. Kanami owns the `Room` model and the script that seeds the rooms.

_Updated October 7, 2026: rooms moved from Supabase to MongoDB, agreed by Eddie and Kanami._

_Updated October 10, 2026: the user ID format is settled. The auth code returns the Postgres user ID as a string, and messages store it as a string in `userId`._

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

**Consequence:** Spelling and capitalization must match exactly everywhere a room is named: the frontend, the Socket.io events, and the history route. A misspelled name is treated as a different, empty room.

_Added October 10, 2026 by Kanami._

### Loading Environment Variables

**Decision:** The `.env` file lives in `server/`. The server loads it with `import 'dotenv/config'` as the first line of `server/src/index.ts`. Standalone scripts, such as the room seed script, start with the same import.

**Reason:** All secrets so far (`MONGODB_URI`, `POSTGRES_URI`) are used only by the server, so the file sits next to the code that reads it.

**Consequence:** Server commands must run with `server/` as the working directory, which `npm run <script> --prefix server` and the root `npm run dev` already do. The `dev` and `start` scripts in `server/package.json` also still pass Node's `--env-file-if-exists=.env` flag, which is now redundant.

_Moved from Open Questions on October 10, 2026._

### MongoDB Atlas Network Access

**Decision:** The Atlas cluster accepts connections from any IP address (`0.0.0.0/0`). The password in `MONGODB_URI` is the only protection. _To be confirmed by Eddie and Tanisha._

**Reason:** Home and mobile IP addresses change often, and each change blocked the connection until the new address was added by hand. This is a short practice project with no real user data.

**Consequence:** `MONGODB_URI` must never be committed or posted publicly; share it by direct message. The rule should be removed, or the cluster paused, when the project ends.

_Added October 10, 2026 by Kanami._

## Open Questions

### Session Handling

After login, how does the app remember the user (for example a JWT or a server session), and how does a Socket.io connection prove who the user is? _Owners: Eddie and Tanisha_

### Hosting

Where will the app run for the demo?

### Merge Method

Merge commit, squash, or rebase? All three are currently allowed, and GitHub defaults to a merge commit.

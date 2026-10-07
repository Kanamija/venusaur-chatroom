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

**Decision:** Supabase (Postgres) stores users and rooms. MongoDB stores chat history.

**Reason:** Each owner gets a distinct data area to work in.

**Consequence:** Messages in MongoDB refer to users and rooms that live in Supabase, so both sides must agree on the IDs used to link them.

### Repository Layout

**Decision:** One repository with two separate apps: `client/` (React + Vite) and `server/` (Express). Each has its own `package.json`. A root `package.json` uses `concurrently` so `npm run dev` starts both.

**Reason:** The browser and Node need different dependencies and TypeScript settings, so keeping them separate keeps each side's setup clear. One start command makes local development easier for the whole team.

**Consequence:** Dependencies are installed in three places: the root, `client/`, and `server/`. npm workspaces could reduce this to one install later if the team wants.

### ES Modules on the Server

**Decision:** The server uses ES Modules (`import`/`export`), with `"type": "module"` in `server/package.json` and `"module": "nodenext"` in `server/tsconfig.json`.

**Reason:** The client already uses ES Modules, so both sides of the codebase use the same syntax, and ESM is the modern standard for Node.

**Consequence:** Server code uses `import`, not `require`.

## Open Questions

### Loading Environment Variables

Nothing reads a `.env` file yet. Where should `.env` live (the repository root or `server/`), and how should the server load it (for example Node's built-in `--env-file` flag)? This needs answering before the first real secret, such as `MONGODB_URI`, is used.

### Session Handling

After login, how does the app remember the user (for example a JWT or a server session), and how does a Socket.io connection prove who the user is? _Owners: Eddie and Tanisha_

### Hosting

Where will the app run for the demo?

### Merge Method

Merge commit, squash, or rebase? All three are currently allowed, and GitHub defaults to a merge commit.

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

**Decision:** The team builds its own sign-up and login with bcrypt for password hashing, instead of using Supabase Auth. *To be confirmed by Eddie.*

**Reason:** Building auth by hand is part of the practice.

**Consequence:** The team is responsible for hashing, verifying passwords, and keeping users logged in. How sessions or tokens work is still open.

### Data Split Between Supabase and MongoDB

**Decision:** Supabase (Postgres) stores users and rooms. MongoDB stores chat history.

**Reason:** Each owner gets a distinct data area to work in.

**Consequence:** Messages in MongoDB refer to users and rooms that live in Supabase, so both sides must agree on the IDs used to link them.

## Open Questions

### Session Handling

After login, how does the app remember the user (for example a JWT or a server session), and how does a Socket.io connection prove who the user is? *Owners: Eddie and Tanisha*

### Repository Layout

Should the frontend and backend share one repository with separate folders (for example `client/` and `server/`), and how is the app started locally?

### Hosting

Where will the app run for the demo?

### Merge Method

Merge commit, squash, or rebase? All three are currently allowed, and GitHub defaults to a merge commit.

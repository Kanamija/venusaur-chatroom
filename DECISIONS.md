# Venusaur Chatroom Decisions

This document records the team's technical decisions and the reasoning behind them, plus decisions still open. Scope and goals live in `PROJECT_BRIEF.md`.

When a decision is made, move it from **Open Questions** into **Decided** with its reasoning.

## Decided

### Tech Stack

**Decision:** React + Vite, Express, Socket.io, MongoDB, Supabase, and bcrypt.

**Reason:** The team chose these technologies to practice them during the project.

### Area Ownership

**Decision:** Eddie owns Supabase and authentication, Kanami owns MongoDB, and Tanisha owns Express and Socket.io. Frontend components go to whoever finishes first.

**Reason:** Each person goes deep on one technology, and shared frontend work keeps everyone busy.

### Public Repository with a Protected `main`

**Decision:** The repository is public. `main` requires a pull request with one approval, blocks force pushes and deletion, and has no bypass, including for the owner.

**Reason:** Branch rulesets are free on public repositories. Required reviews make everyone practice the PR workflow.

**Consequence:** Never commit secrets. See `CONTRIBUTING.md`.

## Open Questions

### Supabase vs. bcrypt for Passwords

Supabase Auth hashes and stores passwords itself, so bcrypt is only needed if the team writes its own login logic. Which approach is the team using? *Owner: Eddie*

### What Lives in MongoDB vs. Supabase

Supabase runs on Postgres, so the project has two databases. Which data goes where (users, rooms, messages)? *Owners: Eddie and Kanami*

### JavaScript or TypeScript

Not decided.

### Repository Layout

Should the frontend and backend share one repository with separate folders (for example `client/` and `server/`), and how is the app started locally?

### Hosting

Where will the app run for the demo?

### Merge Method

Merge commit, squash, or rebase? All three are currently allowed, and GitHub defaults to a merge commit.

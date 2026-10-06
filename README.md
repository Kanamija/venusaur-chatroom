# Venusaur Chatroom

A real-time chat application built by a three-person team in a 10-day sprint.

Users create an account, sign in, and chat live in one of three rooms.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Express |
| Real-time | Socket.io |
| Database | MongoDB |
| Auth | Supabase, bcrypt |

How MongoDB and Supabase divide responsibilities is still an open question. See `DECISIONS.md`.

## Team

| Name | Owns |
|---|---|
| Eddie | Supabase and authentication |
| Kanami | MongoDB |
| Tanisha | Express and Socket.io |
| Everyone | Frontend components (first come, first served) |

## Getting Started

> Setup instructions will be added once the project is scaffolded.

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.
3. Install dependencies and start the app (commands TBD).

## Documentation

| Document | Owns |
|---|---|
| `README.md` | Project introduction, setup, and running the app |
| `PROJECT_BRIEF.md` | Goals, MVP scope, timeline, and stretch goals |
| `DECISIONS.md` | Technical decisions, their reasoning, and open questions |
| `CONTRIBUTING.md` | Git workflow, branches, commits, and pull requests |
| `AGENTS.md` | How AI coding agents should behave in this repository |

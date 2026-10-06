# Venusaur Chatroom

A real-time chat application built by a three-person team in a 10-day sprint.

Users create an account, sign in, and chat live in one of three rooms.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Frontend | React + Vite |
| Backend | Express |
| Real-time | Socket.io |
| Users and rooms | Supabase (Postgres) |
| Chat history | MongoDB |
| Auth | Custom, with bcrypt |

See `DECISIONS.md` for why.

## Team

| Name | Owns |
|---|---|
| Eddie | Supabase (users, rooms) and authentication |
| Kanami | MongoDB (chat history) |
| Tanisha | Express and Socket.io |
| Everyone | Frontend components (first come, first served) |

## Project Structure

```text
venusaur-chatroom/
├── client/         React + Vite frontend
├── server/         Express backend
└── package.json    Root scripts for running both apps together
```

`client/` and `server/` are separate apps, each with its own `package.json` and dependencies.

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm

### Install

Dependencies are installed separately in the root, `client/`, and `server/`:

```bash
git clone https://github.com/Kanamija/venusaur-chatroom.git
cd venusaur-chatroom
npm install
npm install --prefix client
npm install --prefix server
```

On npm 12 or newer, you may see `install-scripts` warnings about `esbuild` and `fsevents` being blocked. They are harmless, and the app still runs.

### Environment Variables

`.env.example` lists the variables the project will use. The app doesn't read a `.env` file yet, so you can skip this step for now. See `DECISIONS.md`.

### Run

From the repository root:

```bash
npm run dev
```

This starts both apps in one terminal:

| App | URL |
|---|---|
| Client | http://localhost:5173 |
| Server | http://localhost:3000/health returns `{"ok":true}` |

To run one app on its own, use `npm run dev` inside `client/` or `server/`.

### Before Opening a Pull Request

`npm run dev` does not type-check your code. Run these in each folder you changed:

| Folder | Commands |
|---|---|
| `client/` | `npm run build` and `npm run lint` |
| `server/` | `npm run build` |

## Documentation

| Document | Owns |
|---|---|
| `README.md` | Project introduction, setup, and running the app |
| `PROJECT_BRIEF.md` | Goals, MVP scope, timeline, and stretch goals |
| `DECISIONS.md` | Technical decisions, their reasoning, and open questions |
| `CONTRIBUTING.md` | Git workflow, branches, commits, and pull requests |
| `AGENTS.md` | How AI coding agents should behave in this repository |

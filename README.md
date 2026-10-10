# Venusaur Chatroom

A real-time chat application built by a three-person team in a 10-day sprint.

Users create an account, sign in, and chat live in one of three rooms.

## Tech Stack

| Layer                  | Technology          |
| ---------------------- | ------------------- |
| Language               | TypeScript          |
| Frontend               | React + Vite        |
| Backend                | Express             |
| Real-time              | Socket.io           |
| Users                  | Supabase (Postgres) |
| Rooms and chat history | MongoDB             |
| Auth                   | Custom, with bcrypt |

See `DECISIONS.md` for why.

## Team

| Name     | Owns                                           |
| -------- | ---------------------------------------------- |
| Eddie    | Supabase (users) and authentication            |
| Kanami   | MongoDB (rooms and chat history)               |
| Tanisha  | Express and Socket.io                          |
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

- Node.js 22.13+ or 24+
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

Copy `server/.env.example` to `server/.env` and configure the required variables.

```bash
cd server
cp .env.example .env
```

Configure the following variables:

- `AUTH_DB=postgres` — Selects PostgreSQL for authentication.
- `POSTGRES_URI` — PostgreSQL connection string from Supabase.
- `MONGODB_URI` — MongoDB connection string for rooms and chat history.

PostgreSQL authentication is currently implemented. MongoDB authentication support is planned.

Do not commit `.env` files containing credentials.

### PostgreSQL Authentication Setup

When using PostgreSQL for authentication (`AUTH_DB=postgres`):

1. Create a Supabase PostgreSQL project.
2. Open the SQL Editor.
3. Open `server/sql/001_create_users.sql`.
4. Replace the placeholder password with a secure password.
5. Execute the SQL to create the users table and restricted application user.
6. Configure `POSTGRES_URI` in `server/.env` using the connection credentials for `chatroom_app_user`.

The application database user has only `SELECT` and `INSERT` permissions on the `users` table.

Keep database credentials private and never commit your `.env` file.

### MongoDB Setup

Rooms and chat history are stored in MongoDB. After `MONGODB_URI` is set in `server/.env`, create the three chat rooms from the repository root:

```bash
npm run seed --prefix server
```

This only needs to run once per database. It is safe to run again: rooms that already exist are left alone.

### Run

From the repository root:

```bash
npm run dev
```

This starts both apps in one terminal:

| App    | URL                                                |
| ------ | -------------------------------------------------- |
| Client | http://localhost:5173                              |
| Server | http://localhost:3000/health returns `{"ok":true}` |

To run one app on its own, use `npm run dev` inside `client/` or `server/`.

### Before Opening a Pull Request

`npm run dev` does not type-check your code. Run these in each folder you changed:

| Folder    | Commands                           |
| --------- | ---------------------------------- |
| `client/` | `npm run build` and `npm run lint` |
| `server/` | `npm run build`                    |

Then, from the repository root, check formatting:

```bash
npm run format:check
```

If it reports files, run `npm run format` to fix them and commit the result.

## Documentation

| Document           | Owns                                                     |
| ------------------ | -------------------------------------------------------- |
| `README.md`        | Project introduction, setup, and running the app         |
| `PROJECT_BRIEF.md` | Goals, MVP scope, timeline, and stretch goals            |
| `DECISIONS.md`     | Technical decisions, their reasoning, and open questions |
| `CONTRIBUTING.md`  | Git workflow, branches, commits, and pull requests       |
| `AGENTS.md`        | How AI coding agents should behave in this repository    |

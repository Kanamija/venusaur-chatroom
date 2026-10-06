# Contributing to Venusaur Chatroom

This document covers the team's Git workflow, branch naming, commit messages, and pull-request process. AI coding agents should also read `AGENTS.md`.

## Git Workflow

`main` is protected. Nobody pushes to it directly, and every change goes through a pull request with one approval.

```text
pick a task
→ create a branch from main
→ make focused changes and commit
→ push the branch
→ open a pull request into main
→ get one teammate's approval
→ merge
```

### Starting New Work

```bash
git switch main
git pull origin main
git switch -c <type>/<short-description>
```

## Branch Naming

```text
<type>/<short-description>
```

- `feat/` new feature
- `fix/` bug fix
- `refactor/` restructuring without changing behavior
- `docs/` documentation
- `test/` tests
- `chore/` configuration or tooling
- `style/` visual styling or formatting

Examples: `feat/room-list`, `feat/signup-form`, `fix/socket-reconnect`, `chore/setup-vite`

Keep branch names lowercase with hyphens. Use one branch per task, and delete it after it's merged.

## Commit Messages

Follow Conventional Commits:

```text
<type>(<scope>): <short description>
```

Suggested scopes: `client`, `server`, `auth`, `db`, `sockets`, `docs`

Examples:

```text
feat(sockets): broadcast messages to room members
feat(auth): add sign-up route
fix(db): save message timestamps
docs(readme): add setup steps
```

Rules:

- Keep the subject under 72 characters.
- Use imperative mood: `add`, not `added`.
- Use lowercase after the colon, with no trailing period.
- One logical change per commit.

## Pull Requests

- Open pull requests against `main`.
- Fill in the pull request template: summary, changes, type, and how to test.
- Only list commands you actually ran.
- Keep each pull request focused on one task.
- If a change touches another teammate's area, tag them for review.

### Before Opening a Pull Request

```bash
git switch main
git pull origin main
git switch <your-branch>
git merge main
```

Then check the following. `npm run dev` does not type-check, so the build step is what catches TypeScript errors. See `README.md` for how to run the app.

- The app starts locally.
- If you changed `client/`: `npm run build` and `npm run lint` pass in `client/`.
- If you changed `server/`: `npm run build` passes in `server/`.
- You tested the change by hand.
- Debugging code and stray `console.log`s are removed.
- No secrets or `.env` files are included.
- Docs are updated if behavior or decisions changed.

## Reviewing

Reviewers should check that the change:

- matches the task
- works when tested by hand
- doesn't break another teammate's area

Keep comments clear, kind, and about the code.

## After a Pull Request Is Merged

```bash
git switch main
git pull origin main
git branch -d <branch-name>
```

## Secrets

The repository is public. Never commit API keys, database URLs, or passwords. Put real values in `.env`, which is gitignored, and add only the variable names to `.env.example`. If a secret is ever pushed, revoke it immediately, because deleting the commit is not enough.

## Documentation Ownership

Each document owns one concept. Reference it instead of copying its details:

- `README.md` covers introduction, setup, and running the app
- `PROJECT_BRIEF.md` covers goals, MVP scope, ownership, timeline, and stretch goals
- `DECISIONS.md` covers technical decisions, their reasoning, and open questions
- `CONTRIBUTING.md` covers Git workflow and pull requests
- `AGENTS.md` covers AI-agent behavior

If code and docs disagree, point out the inconsistency rather than guessing which one is right.

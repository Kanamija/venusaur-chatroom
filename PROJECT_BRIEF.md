# Venusaur Chatroom Project Brief

This document owns the project's goals, MVP scope, ownership, timeline, and stretch goals. Technical choices and their reasoning live in `DECISIONS.md`.

## Summary

Venusaur Chatroom is a real-time chat application where users sign up, log in, and send messages in one of three chat rooms.

## Goals

The project is a 10-day team exercise. The main goal is hands-on practice with:

- TypeScript
- React and Vite
- Express
- Socket.io
- MongoDB
- Supabase (Postgres)
- building authentication from scratch with bcrypt
- a pull-request-based Git workflow

## MVP Scope

- **Accounts:** users can sign up, log in, and log out with real accounts.
- **Rooms:** three chat rooms. Users can join a room and switch between rooms.
- **Messaging:** messages appear live for everyone in the same room.
- **History:** messages are saved so the chat history persists.

## Ownership

| Area                                       | Owner                             |
| ------------------------------------------ | --------------------------------- |
| Supabase (users, rooms) and authentication | Eddie                             |
| MongoDB (chat history)                     | Kanami                            |
| Express and Socket.io                      | Tanisha                           |
| Frontend components                        | Whoever finishes their area first |

## Timeline

- **Deadline:** October 17, 2026

## Stretch Goals

None agreed yet. Add ideas here only after the team agrees, and keep them out of the MVP.

## Open Questions

- What are the three rooms called, and are they fixed or user-created?
- How much history loads when a user joins a room (all of it, or the most recent messages)?
- Where will the app be hosted for the demo?

-- Create the sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Grant only the permissions needed to look up, create, and delete sessions
GRANT SELECT, INSERT, DELETE
ON TABLE sessions
TO chatroom_app_user;
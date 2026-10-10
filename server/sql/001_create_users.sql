-- Create the users table
CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a restricted database user for the application
CREATE USER chatroom_app_user WITH PASSWORD 'replace_with_secure_password';

-- Grant access to the schema
GRANT USAGE ON SCHEMA public TO chatroom_app_user;

-- Grant only the permissions needed for signup and login
GRANT SELECT, INSERT
ON TABLE users
TO chatroom_app_user;
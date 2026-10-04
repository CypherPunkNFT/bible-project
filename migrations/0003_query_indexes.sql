-- statement
CREATE INDEX testimony_connection_order ON testimony_connections(parent_id,accepted_at,child_id);
-- statement
CREATE INDEX testimony_session_account ON testimony_sessions(account_id);
-- statement
CREATE INDEX testimony_session_expiry ON testimony_sessions(expires_at);
-- statement
CREATE INDEX testimony_limit_expiry ON testimony_limits(expires_at);

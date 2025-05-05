CREATE TABLE workspace (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE plan (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspace(id),
    name TEXT NOT NULL,
    description TEXT
);

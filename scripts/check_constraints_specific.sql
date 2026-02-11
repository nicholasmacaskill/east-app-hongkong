SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table_name,
    pg_get_constraintdef(oid) AS constraint_def
FROM
    pg_constraint
WHERE
    conrelid IN ('likes'::regclass, 'posts'::regclass, 'admin_audit_logs'::regclass, 'profiles'::regclass);

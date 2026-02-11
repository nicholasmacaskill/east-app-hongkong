SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table_name
FROM
    pg_constraint
WHERE
    confrelid = 'auth.users'::regclass;

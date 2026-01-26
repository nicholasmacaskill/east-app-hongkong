-- Force schema cache reload by notifying pgrst
NOTIFY pgrst, 'reload config';

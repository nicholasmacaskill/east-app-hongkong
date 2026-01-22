-- Enable real-time for the profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Set replica identity to FULL to ensure all columns (like account_status) are included in the broadcast
ALTER TABLE profiles REPLICA IDENTITY FULL;

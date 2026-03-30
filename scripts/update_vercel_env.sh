#!/bin/bash

# Vercel requires yes confirmation sometimes, but passing from stdin circumvents interactive value.
# Wait, if we use echo it won't ask for the value. But it might ask to override?
# If we branch specify, it usually just adds it. Let's see.

echo "https://lzqnviblkcnjsxutqeht.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview test --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjIxMjEsImV4cCI6MjA5MDM5ODEyMX0.VpLqian14mtK66LFhc8Y7UgEsdqPI9c5ajyJhvOGmqc" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview test --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyMjEyMSwiZXhwIjoyMDkwMzk4MTIxfQ.zkfbtc7Bv_Dsswe9Nwtzf9Yq4ZO4JdLzDRSuGxGq9uk" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview test --force

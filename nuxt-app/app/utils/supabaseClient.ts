import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yzlaeffgirrlwdeuyjpm.supabase.co'  //Supabase URL
const supabaseKey =
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bGFlZmZnaXJybHdkZXV5anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2Mjk5MjksImV4cCI6MjA2OTIwNTkyOX0.XlhHEg7L9rbezRdYWAl1UwkpjUh4sV0BTwsePfMyfDs'             //anon key

 export const supabase = createClient(supabaseUrl, supabaseKey)

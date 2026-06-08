import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://ytyydnetlsrldnnkvfxa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXlkbmV0bHNybGRubmt2ZnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDA2ODgsImV4cCI6MjA5MzI3NjY4OH0.iolpQ1r8DyTdepI8kLowIGEXk_-He0xhbmSYwTrhDyU";

export const supabase = createClient(supabaseUrl, supabaseKey);

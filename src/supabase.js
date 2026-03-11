import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hfojuszjknpqqqrejivs.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmb2p1c3pqa25wcXFxcmVqaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjI0MDUsImV4cCI6MjA4ODczODQwNX0.oaDOWYeU7gvXJtjAumwForOClcGgqrsCs2RKYkMhCbw"

export const supabase = createClient(supabaseUrl, supabaseKey)
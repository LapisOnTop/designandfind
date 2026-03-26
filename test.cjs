const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://gqmwlbowkjrbahnlgxoy.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXdsYm93a2pyYmFobmxneG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDUwOTEsImV4cCI6MjA4OTgyMTA5MX0.LCsY5Lpz6D882hBGvpDaxQnaRwPl-avJYf422c51BBk"
);

async function test() {
    const email = "fresh" + Date.now() + "@test.com";
    console.log("Testing fresh signup for", email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: "password123",
    });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success! Data:", JSON.stringify(data, null, 2));
    }
}

test();

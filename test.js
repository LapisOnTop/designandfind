import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function test() {
    const email = "test" + Date.now() + "@test.com";
    console.log("Testing fresh signup for", email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: "password123",
    });

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success! User identities:", data?.user?.identities);
    }
}

test();

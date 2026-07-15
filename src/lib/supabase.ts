import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase frontend env vars are missing.");
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return browserClient;
}

export async function getAccessToken(): Promise<string> {
  const client = getBrowserSupabaseClient();
  const sessionResult = await client.auth.getSession();
  const existingToken = sessionResult.data.session?.access_token;
  if (existingToken) {
    return existingToken;
  }
  throw new Error("Authentication required. Sign in with Google to continue.");
}

export async function signInWithGoogle(): Promise<void> {
  const client = getBrowserSupabaseClient();
  const redirectTo = typeof window === "undefined" ? undefined : `${window.location.origin}/`;
  const result = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function signOutUser(): Promise<void> {
  const client = getBrowserSupabaseClient();
  const result = await client.auth.signOut();
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getBrowserSupabaseClient();
  const result = await client.auth.getSession();
  return result.data.session ?? null;
}

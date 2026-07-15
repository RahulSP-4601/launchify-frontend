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
  const session = sessionResult.data.session;
  const existingToken = session?.access_token;
  const expiresAt = (session?.expires_at ?? 0) * 1000;
  if (existingToken && expiresAt > Date.now() + 30_000) {
    return existingToken;
  }
  const refreshedToken = await refreshAccessToken();
  if (refreshedToken) {
    return refreshedToken;
  }
  if (existingToken) {
    return existingToken;
  }
  throw new Error("Authentication required. Sign in with Google to continue.");
}

export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign in must be started from a browser.");
  }
  const client = getBrowserSupabaseClient();
  const redirectTo = `${window.location.origin}/`;
  const result = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  const authUrl = result.data.url;
  if (!authUrl) {
    throw new Error("Google sign in could not be started. Missing OAuth redirect URL.");
  }
  window.location.assign(authUrl);
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

export async function refreshAccessToken(): Promise<string> {
  const client = getBrowserSupabaseClient();
  const result = await client.auth.refreshSession();
  return result.data.session?.access_token ?? "";
}

export async function clearAuthSession(): Promise<void> {
  const client = getBrowserSupabaseClient();
  await client.auth.signOut({ scope: "local" });
}

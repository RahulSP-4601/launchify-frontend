import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

  const signInResult = await client.auth.signInAnonymously();
  const accessToken = signInResult.data.session?.access_token;
  if (!accessToken) {
    const message = signInResult.error?.message ?? "Unable to create an anonymous Supabase session.";
    throw new Error(message);
  }
  return accessToken;
}

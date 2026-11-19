import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseServerCredentials } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseServerCredentials();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Cookie updates are supported
          // in Server Actions and Route Handlers, where this client is writable.
          // Add a Next.js proxy only when Supabase Auth session refresh is introduced.
        }
      },
    },
  });
}

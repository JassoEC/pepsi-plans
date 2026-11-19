import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseBrowserCredentials } from "./config";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseBrowserCredentials();

  return createBrowserClient(url, key);
}

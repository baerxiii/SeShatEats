const SUPABASE_URL = "https://uzbbwvihkfzdbnowhglc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a6YEwdDOpkZ6BI8pHXVPnQ_WlFMlHmf";

// The CDN's `supabase` global is the SDK (it has createClient), not an
// authenticated client. Keep it as the SDK and create the configured client.
const supabaseSDK = window.supabase;
if (!supabaseSDK || typeof supabaseSDK.createClient !== "function") {
  throw new Error("Supabase SDK did not load. Check the CDN script and network connection.");
}

const supabaseClient = supabaseSDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Existing app pages call `supabase.auth`; expose the configured client's Auth
// API on the SDK global for compatibility. All database requests use supabaseClient.
if (!supabaseSDK.auth) {
  Object.defineProperty(supabaseSDK, "auth", {
    configurable: true,
    enumerable: false,
    value: supabaseClient.auth
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ============================================
// 🔐 TELEGRAM HMAC-SHA256 VERIFICATION (აღდგენილია)
// ============================================
async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return false;
    params.delete("hash");

    // auth_date ასაკი (replay attack თავიდან)
    const authDate = params.get("auth_date");
    if (!authDate) return false;
    const ageSeconds = Date.now() / 1000 - parseInt(authDate, 10);
    if (ageSeconds > 86400) return false; // 24h-ზე ძველი უარყოფილია

    const dataCheckArr: string[] = [];
    for (const [key, value] of [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      dataCheckArr.push(`${key}=${value}`);
    }
    const dataCheckString = dataCheckArr.join("\n");

    const encoder = new TextEncoder();

    // secret_key = HMAC-SHA256(key="WebAppData", data=BOT_TOKEN)
    const webAppDataKey = await crypto.subtle.importKey(
      "raw", encoder.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const secretKeyBytes = await crypto.subtle.sign("HMAC", webAppDataKey, encoder.encode(botToken));

    // computed_hash = HMAC-SHA256(key=secret_key, data=dataCheckString)
    const secretKey = await crypto.subtle.importKey(
      "raw", secretKeyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(dataCheckString));

    const computedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash === hash;
  } catch (err) {
    console.error("❌ Verification error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔐 HMAC VERIFICATION (აღდგენილია!)
    if (!BOT_TOKEN) {
      console.error("❌ TELEGRAM_BOT_TOKEN not set");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyTelegramInitData(initData, BOT_TOKEN);
    if (!isValid) {
      console.error("❌ Invalid Telegram signature - BLOCKED");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Telegram signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("✅ Telegram signature verified");

    // 1. პარსინგი
    const params: Record<string, string> = {};
    initData.split("&").forEach((pair) => {
      const firstEqualIndex = pair.indexOf("=");
      if (firstEqualIndex === -1) return;
      const key = pair.substring(0, firstEqualIndex);
      const value = pair.substring(firstEqualIndex + 1);
      params[key] = decodeURIComponent(value.replace(/\+/g, "%2B"));
    });

    // 2. user JSON
    const userJson = params.user;
    if (!userJson) {
      return new Response(
        JSON.stringify({ success: false, error: "No user data in Telegram initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tgUser = JSON.parse(userJson);

    // 3. Supabase Auth
    const email = `telegram_${tgUser.id}@lunara.app`;
    const password = `tg_secure_auth_${tgUser.id}`;

    let authUser;
    let session;

    try {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      authUser = signInData.user;
      session = signInData.session;
    } catch (err) {
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
        },
      });
      if (signUpError) {
        console.error("❌ Error creating user:", signUpError);
        throw signUpError;
      }
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      authUser = signInData.user;
      session = signInData.session;
    }

    return new Response(
      JSON.stringify({ success: true, session: session, user: authUser }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Edge Function error:", error);
    // გენერიკული error client-ისთვის (დეტალები მხოლოდ server log-ში)
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
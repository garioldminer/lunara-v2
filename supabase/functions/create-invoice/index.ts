import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const PROVIDER_TOKEN = Deno.env.get("TELEGRAM_PROVIDER_TOKEN") || "stars";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateInvoiceRequest {
  feature_id: string;
  user_id: string;
  stars: number;
  title: string;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const { feature_id, user_id, stars, title, description }: CreateInvoiceRequest = await req.json();

    console.log("📦 Creating invoice:", { feature_id, user_id, stars, title });

    const payload = `invoice_${feature_id}_${user_id}_${Date.now()}`;
    
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
    
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        description: description,
        payload: payload,
        provider_token: PROVIDER_TOKEN === "stars" ? "" : PROVIDER_TOKEN,
        currency: "XTR",
        prices: [
          {
            label: title,
            amount: stars,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("📡 Telegram response:", data);

    if (!data.ok) {
      console.error("❌ Telegram API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to create invoice", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("invoices").insert({
      user_id,
      feature_id,
      stars,
      payload,
      status: "pending",
      invoice_url: data.result,
    });

    return new Response(
      JSON.stringify({ invoice_url: data.result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
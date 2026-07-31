import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  try {
    const { user_id, coins_amount, stars_amount, description } = await req.json();

    if (!user_id || !coins_amount || !stars_amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Telegram-ის payload უნდა შეიცავდეს user_id-ს, რომ Webhook-მა იცოდეს ვის დაურიცხოს
    const payload = JSON.stringify({ 
      type: "diamonds", 
      user_id: user_id, 
      coins: coins_amount 
    });

    const invoiceData = {
      title: "დიამონდების შეძენა",
      description: description,
      payload: payload,
      provider_token: "", // ცარიელია Telegram Stars-ისთვის
      currency: "XTR", // Telegram Stars-ის ვალუტა
      prices: [{ label: "Diamonds", amount: stars_amount }],
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description || "Failed to create invoice");
    }

    return new Response(JSON.stringify({ invoice_url: result.result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
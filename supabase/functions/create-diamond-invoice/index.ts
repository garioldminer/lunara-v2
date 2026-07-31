import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

console.log('💎 [INVOICE DEBUG] Function initialized');

serve(async (req) => {
  console.log(' [INVOICE DEBUG] Request received');
  console.log('📥 [INVOICE DEBUG] Method:', req.method);
  console.log('📥 [INVOICE DEBUG] URL:', req.url);
  
  try {
    const { user_id, coins_amount, stars_amount, description } = await req.json();
    
    console.log('📋 [INVOICE DEBUG] Parsed body:', {
      user_id,
      coins_amount,
      stars_amount,
      description
    });

    if (!user_id || !coins_amount || !stars_amount) {
      console.error('❌ [INVOICE DEBUG] Missing required fields');
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('❌ [INVOICE DEBUG] TELEGRAM_BOT_TOKEN is not set');
      return new Response(JSON.stringify({ error: "Bot token not configured" }), { status: 500 });
    }

    const payload = JSON.stringify({ 
      type: "diamonds", 
      user_id: user_id, 
      coins: coins_amount 
    });

    console.log('📦 [INVOICE DEBUG] Created payload:', payload);

    const invoiceData = {
      title: "დიამონდების შეძენა",
      description: description,
      payload: payload,
      provider_token: "",
      currency: "XTR",
      prices: [{ label: "Diamonds", amount: stars_amount }],
    };

    console.log('📤 [INVOICE DEBUG] Sending to Telegram API...');
    console.log('📤 [INVOICE DEBUG] Invoice data:', JSON.stringify(invoiceData, null, 2));

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    console.log('📥 [INVOICE DEBUG] Telegram API response status:', response.status);

    const result = await response.json();
    console.log('📥 [INVOICE DEBUG] Telegram API response:', JSON.stringify(result, null, 2));

    if (!result.ok) {
      console.error('❌ [INVOICE DEBUG] Telegram API error:', result.description);
      throw new Error(result.description || "Failed to create invoice");
    }

    console.log('✅ [INVOICE DEBUG] Invoice created successfully');
    console.log(' [INVOICE DEBUG] Invoice URL:', result.result);

    return new Response(JSON.stringify({ invoice_url: result.result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('💥 [INVOICE DEBUG] Exception:', error);
    console.error('💥 [INVOICE DEBUG] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
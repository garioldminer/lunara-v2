import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log("📥 Webhook received:", JSON.stringify(update, null, 2));

    if (update.pre_checkout_query) {
      const preCheckoutQuery = update.pre_checkout_query;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pre_checkout_query_id: preCheckoutQuery.id, ok: true }),
      });
      return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payloadStr = payment.invoice_payload;

      console.log("💰 Successful payment payload:", payloadStr);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payloadStr);
      } catch (e) {
        console.error("❌ Failed to parse payload:", payloadStr);
      }

      // 🌟 დიამონდების შეძენის დამუშავება
      if (parsedPayload && parsedPayload.type === 'diamonds') {
        const userId = parsedPayload.user_id;
        const coinsToAdd = parsedPayload.coins;

        // 1. მიმდინარე ბალანსის მიღება
        const { data: currentEconomy, error: econError } = await supabase
          .from("user_economy")
          .select("cosmic_coins")
          .eq("user_id", userId)
          .single();

        if (econError) {
          console.error("❌ Failed to get current economy:", econError);
        } else {
          const newCoins = (currentEconomy?.cosmic_coins || 0) + coinsToAdd;
          const { error: updateError } = await supabase
            .from("user_economy")
            .update({ cosmic_coins: newCoins })
            .eq("user_id", userId);

          if (updateError) {
            console.error("❌ Failed to update coins:", updateError);
          } else {
            console.log(`✅ Added ${coinsToAdd} coins to user ${userId}. New balance: ${newCoins}`);
          }
        }

        // 2. შეძენის ლოგირება (purchases ცხრილში)
        await supabase.from("purchases").insert({
          user_id: userId,
          feature_id: "diamonds",
          stars: payment.total_amount, 
          telegram_charge_id: payment.telegram_payment_charge_id,
          purchased_at: new Date().toISOString(),
        }).catch(err => console.error("Failed to log purchase:", err));

        // 3. მომხმარებლისთვის შეტყობინების გაგზავნა
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: update.message.chat.id,
            text: `🎉 წარმატებით შეიძინე ${coinsToAdd} დიამონდი! ისინი უკვე შენს ანგარიშზეა.`,
          }),
        }).catch(err => console.error("Failed to send message:", err));

        return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // --- არსებული INVOICE ლოგიკა (პრემიუმისთვის) ---
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("payload", payloadStr)
        .single();

      if (error || !invoice) {
        console.error("❌ Invoice not found for payload:", payloadStr);
        return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
      }

      await supabase.from("invoices").update({
        status: "paid",
        telegram_charge_id: payment.telegram_payment_charge_id,
        paid_at: new Date().toISOString(),
      }).eq("id", invoice.id);

      if (invoice.feature_id.startsWith("subscription_")) {
        const tier = invoice.feature_id === "subscription_monthly" ? "monthly" : 
                     invoice.feature_id === "subscription_yearly" ? "yearly" : "lifetime";
        const expiresAt = new Date();
        if (tier === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
        else if (tier === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else expiresAt.setFullYear(2099);

        await supabase.from("subscriptions").insert({
          user_id: invoice.user_id,
          tier,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          telegram_payment_charge_id: payment.telegram_payment_charge_id,
        });
      } else {
        await supabase.from("purchases").insert({
          user_id: invoice.user_id,
          feature_id: invoice.feature_id,
          stars: invoice.stars,
          telegram_charge_id: payment.telegram_payment_charge_id,
          purchased_at: new Date().toISOString(),
        });
      }

      return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("OK", { status: 200, headers: { "Content-Type": "application/json" } });
  }
});
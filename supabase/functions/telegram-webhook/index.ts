import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  try {
    const update = await req.json();
    console.log("📥 Webhook received:", JSON.stringify(update, null, 2));

    if (update.pre_checkout_query) {
      const preCheckoutQuery = update.pre_checkout_query;
      
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_checkout_query_id: preCheckoutQuery.id,
            ok: true,
          }),
        }
      );
      
      const data = await response.json();
      console.log("✅ Pre-checkout answered:", data);
      
      return new Response("OK", { status: 200 });
    }

    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = payment.invoice_payload;

      console.log("💰 Successful payment:", payload);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("payload", payload)
        .single();

      if (error || !invoice) {
        console.error("❌ Invoice not found for payload:", payload);
        return new Response("OK", { status: 200 });
      }

      await supabase
        .from("invoices")
        .update({
          status: "paid",
          telegram_charge_id: payment.telegram_payment_charge_id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

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

        console.log("✅ Subscription activated for user:", invoice.user_id);
      } else {
        await supabase.from("purchases").insert({
          user_id: invoice.user_id,
          feature_id: invoice.feature_id,
          stars: invoice.stars,
          telegram_charge_id: payment.telegram_payment_charge_id,
          purchased_at: new Date().toISOString(),
        });
        console.log("✅ Single purchase unlocked for user:", invoice.user_id);
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
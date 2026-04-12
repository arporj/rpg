import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the exact chapter payload injected by the database webhook
    const payload = await req.json();
    
    // We expect a database webhook payload structure for INSERT
    if (payload.type !== "INSERT" || payload.table !== "chapters") {
      return new Response(JSON.stringify({ message: "Ignored non-insert or non-chapter event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const newChapter = payload.record;

    // 1. Fetch Session and Chronicle data for context
    const { data: session } = await supabase
      .from('sessions')
      .select('title, chronicle_id')
      .eq('id', newChapter.session_id)
      .single();

    if (!session) throw new Error("Session not found for chapter");

    const { data: chronicle } = await supabase
      .from('chronicles')
      .select('title, slug')
      .eq('id', session.chronicle_id)
      .single();

    if (!chronicle) throw new Error("Chronicle not found");

    // 2. Fetch all appropriate subscribers
    // Subscriber logic: Those who subscribed_all OR are in newsletter_chronicle_subscriptions for this chronicle
    
    const { data: subAll } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('subscribe_all', true);

    const { data: subSpecific } = await supabase
      .from('newsletter_chronicle_subscriptions')
      .select('subscriber_id, newsletter_subscribers!inner(email)')
      .eq('chronicle_id', session.chronicle_id);

    const emailSet = new Set<string>();
    
    if (subAll) {
      subAll.forEach((row: any) => emailSet.add(row.email));
    }
    
    if (subSpecific) {
      subSpecific.forEach((row: any) => emailSet.add(row.newsletter_subscribers.email));
    }

    const emails = Array.from(emailSet);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers found to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const chapterLink = `http://rpg.andreric.com/codex/${chronicle.slug}`;
    const adventureTitle = chronicle.title;
    const sessionTitle = session.title;
    const chapterTitle = newChapter.title;

    // 3. Send email via Brevo
    if (!BREVO_API_KEY) {
      throw new Error("Missing BREVO_API_KEY");
    }

    const bccList = emails.map((email) => ({ email }));

    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #f4ebd8; padding: 40px; border: 1px solid #d4af37;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">O Tomo das Aventuras</h1>
          <hr style="border: 0; border-bottom: 1px solid rgba(212, 175, 55, 0.3); margin: 20px 0;" />
        </div>
        
        <p style="font-size: 18px; line-height: 1.6;">Saudações Aventureiro,</p>
        <p style="font-size: 18px; line-height: 1.6;">Uma nova passagem foi transcrita nas páginas do códice. A história <strong>${adventureTitle}</strong> avança com um novo capítulo em <em>${sessionTitle}</em>.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <h2 style="color: #d4af37; margin-bottom: 10px;">${chapterTitle}</h2>
          <a href="${chapterLink}" style="display: inline-block; padding: 12px 24px; background-color: rgba(212, 175, 55, 0.1); border: 1px solid #d4af37; color: #d4af37; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; font-weight: bold;">
            Ler Novo Capítulo
          </a>
        </div>
        
        <hr style="border: 0; border-bottom: 1px solid rgba(212, 175, 55, 0.3); margin: 30px 0;" />
        <p style="text-align: center; font-size: 14px; color: rgba(244, 235, 216, 0.6); font-style: italic;">
          Que os dados rolem ao seu favor.<br>
          <a href="http://rpg.andreric.com/codex" style="color: #d4af37; text-decoration: underline;">Voltar ao Tomo das Aventuras</a>
        </p>
      </div>
    `;

    const brevoPayload = {
      sender: { name: "O Tomo das Aventuras", email: "noreply@andreric.com" },
      bcc: bccList,
      subject: `Novo Capítulo Escrito: ${adventureTitle} - ${chapterTitle}`,
      htmlContent: htmlContent,
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Brevo Error: ${JSON.stringify(errorData)}`);
    }

    return new Response(JSON.stringify({ 
      message: `Enviado com sucesso para ${emails.length} aventureiros.`,
      emailsSent: emails.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

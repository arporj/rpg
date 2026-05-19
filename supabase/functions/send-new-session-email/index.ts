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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'rpg' }
    });

    const payload = await req.json();
    
    let emails: string[] = [];
    const isManual = payload.type === "MANUAL";
    const sessionId = isManual ? payload.session_id : null;
    const manualEmail = isManual ? payload.email : null;
    
    let session: any = null;
    
    if (isManual) {
      // 1. Carregar os dados da sessão diretamente
      const { data: sessData, error: sessErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (sessErr || !sessData) {
        throw new Error("Session not found for manual notification");
      }
      session = sessData;
      emails = [manualEmail];
    } else {
      // Fluxo automático de webhook após publicação da sessão
      if (payload.type !== "UPDATE" || payload.table !== "sessions") {
        return new Response(JSON.stringify({ message: "Ignored non-update or non-session event" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      session = payload.record;
      const oldSession = payload.old_record || {};

      // Envia APENAS se a sessão mudou de não publicada para publicada
      if (!session.is_published || oldSession.is_published === true) {
        return new Response(JSON.stringify({ message: "Session is not newly published. Ignoring." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // 2. Carregar dados da Crônica para contexto
    const { data: chronicle } = await supabase
      .from('chronicles')
      .select('title, slug')
      .eq('id', session.chronicle_id)
      .single();

    if (!chronicle) {
      throw new Error("Chronicle not found");
    }

    if (!isManual) {
      // 3. Buscar todos os assinantes apropriados
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

      emails = Array.from(emailSet);

      if (emails.length === 0) {
        return new Response(JSON.stringify({ message: "No subscribers found to notify" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Gerar link e informações do e-mail
    const sessionNumber = (session.order_index + 1).toString().padStart(4, '0');
    const sessionLink = `https://rpg.andreric.com/${chronicle.slug}/${sessionNumber}`;
    const adventureTitle = chronicle.title;
    const sessionTitle = session.title;

    // 4. Enviar e-mail via Brevo
    if (!BREVO_API_KEY) {
      throw new Error("Missing BREVO_API_KEY");
    }

    const htmlContent = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171412; width: 100%; margin: 0; padding: 40px 0; font-family: Georgia, serif;">
        <tr>
          <td align="center">
            <div style="background-color: #171412; max-width: 600px; width: 100%; padding: 50px 40px; border: 1px solid rgba(212, 175, 55, 0.25); box-sizing: border-box; text-align: center;">
              <!-- Cabeçalho -->
              <div style="margin-bottom: 45px;">
                <h2 style="color: #a8967a; text-transform: uppercase; letter-spacing: 4px; font-size: 12px; font-weight: normal; margin: 0 0 15px 0;">O Tomo das Aventuras</h2>
                <div style="width: 50px; height: 1px; background-color: #c27c38; margin: 0 auto;"></div>
              </div>

              <!-- Título da Aventura -->
              <h1 style="color: #d47a20; text-transform: uppercase; letter-spacing: 2px; font-size: 28px; font-weight: bold; margin: 0 0 15px 0; line-height: 1.3;">
                ${adventureTitle}
              </h1>

              <!-- Nome da Sessão -->
              <p style="font-style: italic; color: #a8967a; font-size: 18px; margin: 0 0 45px 0; letter-spacing: 1px;">
                — ${sessionTitle} —
              </p>

              <!-- Saudação e Texto Principal -->
              <div style="font-size: 15px; line-height: 1.8; color: #d1c2a5; margin-bottom: 45px; text-align: center; letter-spacing: 0.5px;">
                <p style="margin: 0 0 20px 0;">Saudações, aventureiro.</p>
                <p style="margin: 0 0 20px 0;">A jornada avança — e o mundo se revela cada vez mais vasto e perigoso.</p>
                <p style="margin: 0;">Os próximos acontecimentos já foram registrados no Tomo das Aventuras.</p>
              </div>

              <!-- Botão de Ação (Outline Dourado/Laranja) -->
              <div style="margin-bottom: 50px;">
                <a href="${sessionLink}" style="display: inline-block; padding: 15px 35px; background-color: transparent; border: 1px solid #d47a20; color: #d47a20; text-decoration: none; text-transform: uppercase; letter-spacing: 3px; font-size: 13px; font-weight: bold;">
                  Ler Nova Sessão
                </a>
              </div>

              <!-- Linha divisória antes do rodapé -->
              <div style="width: 100%; height: 1px; background-color: rgba(212, 175, 55, 0.1); margin: 0 auto 30px auto;"></div>

              <!-- Rodapé -->
              <div style="font-size: 10px; letter-spacing: 2px; color: #a8967a; text-transform: uppercase; margin-bottom: 15px; font-weight: bold;">
                Que os dados rolem ao seu favor
              </div>
              
              <div>
                <a href="https://rpg.andreric.com/codex" style="color: #8f7d66; text-decoration: underline; font-size: 12px; letter-spacing: 0.5px;">
                  Ir para a página inicial
                </a>
              </div>
            </div>
          </td>
        </tr>
      </table>
    `;

    let brevoPayload: any = {};
    if (isManual) {
      brevoPayload = {
        sender: { name: "O Tomo das Aventuras", email: "tomo@arrcsistemas.com.br" },
        to: [{ email: manualEmail }],
        subject: `Nova Sessão Publicada: ${adventureTitle} - ${sessionTitle}`,
        htmlContent: htmlContent,
      };
    } else {
      const bccList = emails.map((email) => ({ email }));
      brevoPayload = {
        sender: { name: "O Tomo das Aventuras", email: "tomo@arrcsistemas.com.br" },
        to: [{ name: "O Tomo das Aventuras", email: "tomo@arrcsistemas.com.br" }],
        bcc: bccList,
        subject: `Nova Sessão Publicada: ${adventureTitle} - ${sessionTitle}`,
        htmlContent: htmlContent,
      };
    }

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
      message: isManual 
        ? `Notificação manual enviada com sucesso para ${manualEmail}.` 
        : `Enviado com sucesso para ${emails.length} aventureiros.`,
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

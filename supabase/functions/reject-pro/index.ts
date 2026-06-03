import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BASE_URL = "https://rghjgyzpdadapmktislv.supabase.co/functions/v1";

function txt(body: string): Response {
  return new Response(body + "\n", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("id");
  const step = url.searchParams.get("step");

  if (!requestId) return txt("MIDA\n\nErreur : identifiant manquant.");

  const { data: row } = await admin.from("pro_requests").select("*").eq("id", requestId).single();
  if (!row) return txt("MIDA\n\nDemande introuvable ou deja traitee.");
  if (row.status !== "pending") return txt("MIDA\n\nCette demande a deja ete traitee : " + row.status);

  if (step !== "confirm") {
    return txt(
      "MIDA — Administration\n" +
      "─────────────────────────────\n\n" +
      "Refuser cette demande ?\n\n" +
      "Nom        : " + row.first_name + " " + row.last_name + "\n" +
      "Restaurant : " + row.restaurant_name + "\n" +
      "Ville      : " + (row.city || "—") + "\n\n" +
      "OUI — confirmez en cliquant sur ce lien :\n\n" +
      BASE_URL + "/reject-pro?id=" + requestId + "&step=confirm" +
      "\n\n" +
      "Fermez cette fenetre pour annuler."
    );
  }

  await admin.from("pro_requests").update({ status: "rejected" }).eq("id", requestId);

  if (RESEND_KEY) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
    const userEmail = authUser?.user?.email ?? "";
    if (userEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>", to: [userEmail],
          subject: "MIDA — Votre demande n'a pas ete retenue",
          html: "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto'><h1>MIDA</h1><h2>Bonjour " + row.first_name + ",</h2><p>Après examen, votre demande pour <strong>" + row.restaurant_name + "</strong> n'a pas pu être validée. Contactez-nous : <a href='mailto:contact@mida-food.com'>contact@mida-food.com</a></p><p style='color:#888;font-size:13px'>L'équipe MIDA</p></div>",
        }),
      }).catch(() => {});
    }
  }

  return txt(
    "MIDA\n" +
    "─────────────────────────────\n\n" +
    "✗ REFUSE\n\n" +
    row.first_name + " " + row.last_name + " a ete notifie(e)\n" +
    "du refus de sa demande pour " + row.restaurant_name + ".\n\n" +
    "Vous pouvez fermer cette fenetre."
  );
});

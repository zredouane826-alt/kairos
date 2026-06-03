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
      "Approuver cette demande ?\n\n" +
      "Nom        : " + row.first_name + " " + row.last_name + "\n" +
      "Restaurant : " + row.restaurant_name + "\n" +
      "Ville      : " + (row.city || "—") + "\n\n" +
      "OUI — confirmez en cliquant sur ce lien :\n\n" +
      BASE_URL + "/approve-pro?id=" + requestId + "&step=confirm" +
      "\n\n" +
      "Fermez cette fenetre pour annuler."
    );
  }

  const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
  const userEmail = authUser?.user?.email ?? "";

  try {
    const { data: ownerRow, error: ownerErr } = await admin
      .from("restaurant_owners")
      .upsert({ auth_id: row.user_id, email: userEmail, phone: row.phone, full_name: row.first_name + " " + row.last_name, role: "owner" }, { onConflict: "auth_id" })
      .select("id").single();
    if (ownerErr) throw new Error(ownerErr.message);

    const { data: existingResto } = await admin.from("restaurants").select("id").eq("owner_id", ownerRow.id).maybeSingle();
    let restoId: string;
    if (existingResto) {
      restoId = existingResto.id;
    } else {
      const { data: restoRow, error: restoErr } = await admin.from("restaurants").insert({
        owner_id: ownerRow.id, name: row.restaurant_name,
        address: row.address ?? "", city: (row.city ?? "alger").toLowerCase(),
        phone: row.phone, cuisine_type: "autre", status: "pending",
      }).select("id").single();
      if (restoErr) throw new Error(restoErr.message);
      restoId = restoRow.id;
    }

    await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);
    await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { role: "manager" } });
    await admin.from("pro_requests").update({ status: "approved" }).eq("id", requestId);

    if (RESEND_KEY && userEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>", to: [userEmail],
          subject: "Bienvenue sur MIDA — Votre compte restaurateur est active",
          html: "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto'><h1>MIDA</h1><h2>Félicitations, " + row.first_name + " !</h2><p>Votre compte pour <strong>" + row.restaurant_name + "</strong> est actif. Connectez-vous avec vos identifiants habituels.</p><p style='color:#888;font-size:13px'>L'équipe MIDA</p></div>",
        }),
      }).catch(() => {});
    }

    return txt(
      "MIDA\n" +
      "─────────────────────────────\n\n" +
      "✓ APPROUVE\n\n" +
      row.first_name + " " + row.last_name + " peut se connecter\n" +
      "en tant que restaurateur pour " + row.restaurant_name + ".\n\n" +
      "Email de bienvenue envoye.\n\n" +
      "Vous pouvez fermer cette fenetre."
    );
  } catch (err) {
    return txt("MIDA\n\nErreur : " + String(err));
  }
});
